import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const materiaRoutes = Router();

materiaRoutes.use(authMiddleware);
materiaRoutes.use(tenantMiddleware);

materiaRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materias = await prisma.materia.findMany({
      where: { colegioId: req.user!.colegioId, activo: true },
      include: { profesor: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(materias);
  } catch (err) {
    next(err);
  }
});

materiaRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, profesorId } = req.body;
    if (!nombre || typeof nombre !== 'string') {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }
    const materia = await prisma.materia.create({
      data: {
        colegioId: req.user!.colegioId,
        nombre,
        profesorId: profesorId || null,
      },
    });
    res.status(201).json(materia);
  } catch (err) {
    next(err);
  }
});
