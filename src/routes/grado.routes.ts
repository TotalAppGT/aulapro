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

gradoRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const grado = await prisma.grado.findFirst({
      where: { id: req.params.id, colegioId },
      include: {
        profesorGuia: { select: { id: true, nombre: true, email: true, telefono: true } },
        alumnos: {
          where: { activo: true },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
            activo: true,
            responsable: { select: { id: true, nombre: true, email: true } },
          },
          orderBy: { nombre: 'asc' },
        },
        cursos: {
          include: {
            materia: { select: { id: true, nombre: true } },
            profesor: { select: { id: true, nombre: true } },
          },
        },
        horarios: {
          include: { materia: { select: { nombre: true } } },
          orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
        },
      },
    });

    if (!grado) {
      res.status(404).json({ error: 'Grado no encontrado' });
      return;
    }

    res.json(grado);
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
