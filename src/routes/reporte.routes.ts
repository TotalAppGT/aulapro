import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const reporteRoutes = Router();

reporteRoutes.use(authMiddleware);
reporteRoutes.use(tenantMiddleware);

reporteRoutes.get(
  '/usuarios',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;

      const usuarios = await prisma.usuario.findMany({
        where: { colegioId },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          telefono: true,
          activo: true,
          createdAt: true,
        },
        orderBy: { nombre: 'asc' },
      });

      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  }
);

reporteRoutes.get(
  '/asistencia/:mes',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const { mes } = req.params;

      if (!/^\d{4}-\d{2}$/.test(mes)) {
        res.status(400).json({ error: 'Mes inválido. Formato: YYYY-MM' });
        return;
      }

      const [year, month] = mes.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      const alumnos = await prisma.alumno.findMany({
        where: { colegioId, activo: true },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          grado: { select: { nombre: true } },
        },
        orderBy: { nombre: 'asc' },
      });

      const registros = await prisma.asistencia.findMany({
        where: { colegioId, fecha: { gte: start, lt: end } },
        select: { alumnoId: true, estado: true },
      });

      const detalle = alumnos.map((a) => {
        const delAlumno = registros.filter((r) => r.alumnoId === a.id);
        return {
          alumnoId: a.id,
          alumno: `${a.nombre} ${a.apellido || ''}`.trim(),
          grado: a.grado?.nombre || '-',
          presente: delAlumno.filter((r) => r.estado === 'PRESENTE').length,
          ausente: delAlumno.filter((r) => r.estado === 'AUSENTE').length,
          tarde: delAlumno.filter((r) => r.estado === 'TARDE').length,
          excusa: delAlumno.filter((r) => r.estado === 'EXCUSA').length,
        };
      });

      res.json({ mes, detalle });
    } catch (err) {
      next(err);
    }
  }
);
