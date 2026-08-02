import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const asistenciaRoutes = Router();

asistenciaRoutes.use(authMiddleware);
asistenciaRoutes.use(tenantMiddleware);

asistenciaRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alumnos } = req.body;
    const fecha = new Date();
    const registros = [];
    for (const item of alumnos) {
      const existing = await prisma.asistencia.findFirst({
        where: { colegioId: req.user!.colegioId, alumnoId: item.alumnoId, fecha },
      });
      if (existing) continue;
      const registro = await prisma.asistencia.create({
        data: {
          colegioId: req.user!.colegioId,
          alumnoId: item.alumnoId,
          fecha,
          estado: item.estado,
          justificacion: item.justificacion,
          registradoPor: req.user!.userId,
        },
      });
      registros.push(registro);
    }
    res.status(201).json(registros);
  } catch (err) {
    next(err);
  }
});

asistenciaRoutes.get('/fecha/:fecha', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fecha = new Date(req.params.fecha);
    const registros = await prisma.asistencia.findMany({
      where: { colegioId: req.user!.colegioId, fecha },
      include: { alumno: true },
    });
    res.json(registros);
  } catch (err) {
    next(err);
  }
});
