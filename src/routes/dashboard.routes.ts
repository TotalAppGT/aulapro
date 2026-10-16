import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);
dashboardRoutes.use(tenantMiddleware);

function mesActual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

dashboardRoutes.get(
  '/stats',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const mes = (req.query.mes as string) || mesActual();
      const now = new Date();

      const [totalAlumnos, mensualidadesMes] = await Promise.all([
        prisma.alumno.count({ where: { colegioId, activo: true } }),
        prisma.mensualidad.findMany({
          where: { colegioId, mes },
        }),
      ]);

      const pagados = mensualidadesMes.filter((m) => m.estado === 'PAGADO');
      const vencidos = mensualidadesMes.filter((m) => m.estado === 'VENCIDO');

      const totalRecaudado = pagados.reduce((sum, m) => sum + m.monto, 0);
      const totalPendiente = mensualidadesMes
        .filter((m) => m.estado !== 'PAGADO')
        .reduce((sum, m) => sum + m.monto, 0);
      const moraActual = vencidos.reduce((sum, m) => sum + m.monto, 0);
      const comisionDelMes = pagados.reduce((sum, m) => sum + (m.comisionPlataforma || 0), 0);

      const proximaFechaCobro = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      ).toISOString();

      res.json({
        totalAlumnos,
        pagosDelMes: pagados.length,
        totalRecaudado,
        totalPendiente,
        moraActual,
        porcentajeCompletado:
          mensualidadesMes.length === 0
            ? 0
            : Math.round((pagados.length / mensualidadesMes.length) * 1000) / 10,
        proximaFechaCobro,
        comisionDelMes,
      });
    } catch (err) {
      next(err);
    }
  }
);

dashboardRoutes.get(
  '/historial',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const now = new Date();

      const meses: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const mensualidades = await prisma.mensualidad.findMany({
        where: { colegioId, mes: { in: meses } },
      });

      const historial = meses.map((mes) => {
        const delMes = mensualidades.filter((m) => m.mes === mes);
        return {
          mes,
          recaudado: delMes
            .filter((m) => m.estado === 'PAGADO')
            .reduce((sum, m) => sum + m.monto, 0),
          pendiente: delMes
            .filter((m) => m.estado !== 'PAGADO')
            .reduce((sum, m) => sum + m.monto, 0),
        };
      });

      res.json(historial);
    } catch (err) {
      next(err);
    }
  }
);

dashboardRoutes.get(
  '/resumen',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const now = new Date();

      const startHoy = new Date(now);
      startHoy.setHours(0, 0, 0, 0);
      const finHoy = new Date(startHoy);
      finHoy.setDate(finHoy.getDate() + 1);
      const startMes = new Date(now.getFullYear(), now.getMonth(), 1);

      const [asistHoy, asistMes, grados, alumnosActivos, sesiones, impagas] = await Promise.all([
        prisma.asistencia.findMany({
          where: { colegioId, fecha: { gte: startHoy, lt: finHoy } },
          include: { alumno: { select: { nombre: true, apellido: true, grado: { select: { nombre: true } } } } },
        }),
        prisma.asistencia.findMany({
          where: { colegioId, fecha: { gte: startMes } },
          select: { estado: true, alumnoId: true },
        }),
        prisma.grado.findMany({
          where: { colegioId, activo: true },
          select: { id: true, nombre: true, _count: { select: { alumnos: true } } },
        }),
        prisma.alumno.findMany({ where: { colegioId, activo: true }, select: { id: true, gradoId: true } }),
        prisma.sesionEnVivo.findMany({
          where: { colegioId, fecha: { gte: startHoy } },
          include: { curso: { select: { nombre: true } } },
          orderBy: { fecha: 'asc' },
          take: 5,
        }),
        prisma.mensualidad.findMany({
          where: { colegioId, estado: { in: ['PENDIENTE', 'VENCIDO', 'VERIFICANDO'] } },
          select: { alumnoId: true, monto: true, mes: true },
        }),
      ]);

      const ausentesHoy = asistHoy.filter((a) => a.estado === 'AUSENTE');

      const asistenciaPorGrado = grados.map((g) => {
        const ids = new Set(alumnosActivos.filter((a) => a.gradoId === g.id).map((a) => a.id));
        const rel = asistMes.filter((a) => ids.has(a.alumnoId));
        const total = rel.length;
        const ausentes = rel.filter((a) => a.estado === 'AUSENTE').length;
        const presentes = rel.filter((a) => a.estado === 'PRESENTE').length;
        return {
          gradoId: g.id,
          grado: g.nombre,
          alumnos: g._count.alumnos,
          total,
          presentes,
          ausentes,
          porcentaje: total === 0 ? 0 : Math.round(((total - ausentes) / total) * 1000) / 10,
        };
      });

      const morososMap = new Map<string, { monto: number; meses: number }>();
      for (const m of impagas) {
        const e = morososMap.get(m.alumnoId) || { monto: 0, meses: 0 };
        e.monto += m.monto;
        e.meses += 1;
        morososMap.set(m.alumnoId, e);
      }
      const infoMorosos = await prisma.alumno.findMany({
        where: { id: { in: [...morososMap.keys()] } },
        select: { id: true, nombre: true, apellido: true, grado: { select: { nombre: true } } },
      });
      const morosos = infoMorosos
        .map((a) => ({
          alumnoId: a.id,
          alumno: `${a.nombre} ${a.apellido || ''}`.trim(),
          grado: a.grado?.nombre || '-',
          monto: morososMap.get(a.id)!.monto,
          meses: morososMap.get(a.id)!.meses,
        }))
        .sort((x, y) => y.monto - x.monto)
        .slice(0, 8);

      res.json({
        inasistencias: {
          hoy: ausentesHoy.length,
          presentesHoy: asistHoy.filter((a) => a.estado === 'PRESENTE').length,
          tardesHoy: asistHoy.filter((a) => a.estado === 'TARDE').length,
          totalHoy: asistHoy.length,
          ausentesHoy: ausentesHoy.slice(0, 10).map((a) => ({
            alumno: `${a.alumno.nombre} ${a.alumno.apellido || ''}`.trim(),
            grado: a.alumno.grado?.nombre || '-',
          })),
        },
        asistenciaPorGrado,
        clasesEnVivo: sesiones.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          curso: s.curso.nombre,
          fecha: s.fecha,
          url: s.url,
        })),
        morosos,
      });
    } catch (err) {
      next(err);
    }
  }
);
