import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { planDe } from '../lib/planes';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const alumnoRoutes = Router();

alumnoRoutes.use(authMiddleware);
alumnoRoutes.use(tenantMiddleware);

alumnoRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const rol = req.user!.rol;
    const where: Record<string, unknown> = { colegioId, activo: true };

    if (rol === 'PADRE') {
      where.responsableId = req.user!.userId;
    } else if (rol === 'ALUMNO') {
      const u = await prisma.usuario.findUnique({
        where: { id: req.user!.userId },
        select: { alumnoId: true },
      });
      where.id = u?.alumnoId || '__ninguno__';
    }

    const alumnos = await prisma.alumno.findMany({
      where,
      include: { grado: true, responsable: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(alumnos);
  } catch (err) {
    next(err);
  }
});

alumnoRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { codigo, cui, nombre, apellido, gradoId, fechaNacimiento, direccion, responsableId } = req.body;

    const colegio = await prisma.colegio.findUnique({
      where: { id: req.user!.colegioId },
      select: { plan: true },
    });
    const limite = planDe(colegio?.plan).maxAlumnos;
    if (limite !== null) {
      const actuales = await prisma.alumno.count({
        where: { colegioId: req.user!.colegioId, activo: true },
      });
      if (actuales >= limite) {
        res.status(403).json({
          error: `Límite del plan alcanzado (${limite} alumnos). Actualiza tu plan para agregar más.`,
        });
        return;
      }
    }

    const alumno = await prisma.alumno.create({
      data: {
        colegioId: req.user!.colegioId,
        codigo,
        cui: cui || null,
        nombre,
        apellido,
        gradoId: gradoId || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        direccion,
        responsableId: responsableId || null,
      },
    });
    res.status(201).json(alumno);
  } catch (err) {
    next(err);
  }
});

alumnoRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alumno = await prisma.alumno.findFirst({
      where: { id: req.params.id, colegioId: req.user!.colegioId },
      include: { grado: true, responsable: true },
    });
    if (!alumno) {
      res.status(404).json({ error: 'Alumno no encontrado' });
      return;
    }
    res.json(alumno);
  } catch (err) {
    next(err);
  }
});

