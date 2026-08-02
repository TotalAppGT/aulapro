import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const gradoRoutes = Router();

gradoRoutes.use(authMiddleware);
gradoRoutes.use(tenantMiddleware);

gradoRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grados = await prisma.grado.findMany({
      where: { colegioId: req.user!.colegioId, activo: true },
      include: { profesorGuia: true, _count: { select: { alumnos: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(grados);
  } catch (err) {
    next(err);
  }
});

gradoRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, nivel, profesorGuiaId } = req.body;
    const grado = await prisma.grado.create({
      data: { colegioId: req.user!.colegioId, nombre, nivel, profesorGuiaId },
    });
    res.status(201).json(grado);
  } catch (err) {
    next(err);
  }
});
