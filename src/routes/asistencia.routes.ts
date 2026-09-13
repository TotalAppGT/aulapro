import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { sendAbsenceEmail } from '../services/email.service';

export const asistenciaRoutes = Router();

asistenciaRoutes.use(authMiddleware);
asistenciaRoutes.use(tenantMiddleware);

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

asistenciaRoutes.post(
  '/',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const { alumnos, fecha, materiaId } = req.body as {
        alumnos: { alumnoId: string; estado: string; justificacion?: string }[];
        fecha?: string;
        materiaId?: string | null;
      };

      const dia = fecha ? startOfDay(new Date(fecha)) : startOfDay(new Date());
      const materia = materiaId ? await prisma.materia.findFirst({ where: { id: materiaId, colegioId } }) : null;
      if (materiaId && !materia) {
        res.status(404).json({ error: 'Materia no encontrada' });
        return;
      }

      const colegio = await prisma.colegio.findUnique({ where: { id: colegioId } });

      const registrados: any[] = [];
      const ausentesEmail: { email: string; nombre: string; grado: string }[] = [];

      for (const item of alumnos) {
        const existing = await prisma.asistencia.findFirst({
          where: {
            colegioId,
            alumnoId: item.alumnoId,
            fecha: { gte: dia, lt: endOfDay(dia) },
            materiaId: materia ? materia.id : null,
          },
        });

        let registro;
        if (existing) {
          registro = await prisma.asistencia.update({
            where: { id: existing.id },
            data: {
              estado: item.estado as any,
              justificacion: item.justificacion ?? null,
              registradoPor: req.user!.userId,
            },
          });
        } else {
          registro = await prisma.asistencia.create({
            data: {
              colegioId,
              alumnoId: item.alumnoId,
              materiaId: materia ? materia.id : null,
              fecha: dia,
              estado: item.estado as any,
              justificacion: item.justificacion ?? null,
              registradoPor: req.user!.userId,
            },
          });
        }
        registrados.push(registro);

        if (item.estado === 'AUSENTE') {
          const alumno = await prisma.alumno.findFirst({
            where: { id: item.alumnoId, colegioId },
            include: {
              responsable: { select: { email: true } },
              grado: { select: { nombre: true } },
            },
          });
          if (alumno?.responsable?.email) {
            ausentesEmail.push({
              email: alumno.responsable.email,
              nombre: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
              grado: alumno.grado?.nombre || '',
            });
          }
        }
      }

      if (ausentesEmail.length > 0) {
        const fechaLabel = dia.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const colegioNombre = colegio?.nombre || 'El colegio';
        for (const ausente of ausentesEmail) {
          sendAbsenceEmail(
            ausente.email,
            ausente.nombre,
            fechaLabel,
            colegioNombre,
            ausente.grado,
            materia?.nombre,
          ).catch((err: Error) => {
            console.error('[Email] Fallo aviso de ausencia:', err.message);
          });
        }
      }

      res.status(201).json({
        registrados,
        emailAusenciasEnviados: ausentesEmail.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

asistenciaRoutes.get('/fecha/:fecha', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const dia = startOfDay(new Date(req.params.fecha));
    const materiaId = (req.query.materiaId as string) || null;

    const registros = await prisma.asistencia.findMany({
      where: {
        colegioId,
        fecha: { gte: dia, lt: endOfDay(dia) },
        materiaId: materiaId || null,
      },
      include: { alumno: true },
    });

    const porAlumno: Record<string, string> = {};
    for (const r of registros) {
      porAlumno[r.alumnoId] = r.estado;
    }

    res.json(porAlumno);
  } catch (err) {
    next(err);
  }
});

asistenciaRoutes.get(
  '/alumno/:alumnoId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const { alumnoId } = req.params;

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, colegioId },
        select: { id: true, nombre: true, apellido: true },
      });
      if (!alumno) {
        res.status(404).json({ error: 'Alumno no encontrado' });
        return;
      }

      const registros = await prisma.asistencia.findMany({
        where: { colegioId, alumnoId },
        include: { materia: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' },
        take: 90,
      });

      const presentes = registros.filter((r) => r.estado === 'PRESENTE').length;
      const ausentes = registros.filter((r) => r.estado === 'AUSENTE').length;
      const tardes = registros.filter((r) => r.estado === 'TARDE').length;
      const excusas = registros.filter((r) => r.estado === 'EXCUSA').length;
      const total = registros.length;

      res.json({
        alumno: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
        resumen: { total, presentes, ausentes, tardes, excusas },
        porcientoAsistencia: total === 0 ? 0 : Math.round(((presentes + tardes + excusas) / total) * 1000) / 10,
        registros: registros.map((r) => ({
          id: r.id,
          fecha: r.fecha,
          estado: r.estado,
          justificacion: r.justificacion,
          materia: r.materia?.nombre || null,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

asistenciaRoutes.get(
  '/resumen/:gradoId',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const { gradoId } = req.params;
      const mes = (req.query.mes as string) || (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      })();

      if (!/^\d{4}-\d{2}$/.test(mes)) {
        res.status(400).json({ error: 'Mes inválido. Formato: YYYY-MM' });
        return;
      }

      const [year, month] = mes.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      const alumnos = await prisma.alumno.findMany({
        where: { colegioId, gradoId, activo: true },
        select: { id: true, nombre: true, apellido: true, codigo: true },
        orderBy: { nombre: 'asc' },
      });

      const registros = await prisma.asistencia.findMany({
        where: { colegioId, fecha: { gte: start, lt: end } },
        select: { alumnoId: true, estado: true },
      });

      const detalle = alumnos.map((a) => {
        const delAlumno = registros.filter((r) => r.alumnoId === a.id);
        const presentes = delAlumno.filter((r) => r.estado === 'PRESENTE').length;
        const ausentes = delAlumno.filter((r) => r.estado === 'AUSENTE').length;
        const tardes = delAlumno.filter((r) => r.estado === 'TARDE').length;
        const excusas = delAlumno.filter((r) => r.estado === 'EXCUSA').length;
        const total = delAlumno.length;
        return {
          alumnoId: a.id,
          codigo: a.codigo,
          alumno: `${a.nombre} ${a.apellido || ''}`.trim(),
          presentes,
          ausentes,
          tardes,
          excusas,
          total,
          porcientoAsistencia: total === 0 ? 0 : Math.round(((presentes + tardes + excusas) / total) * 1000) / 10,
        };
      });

      res.json({ mes, detalle });
    } catch (err) {
      next(err);
    }
  }
);
