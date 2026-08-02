import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../lib/roles';

export const colegioRoutes = Router();

colegioRoutes.use(authMiddleware);

colegioRoutes.get('/colegio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;

    const colegio = await prisma.colegio.findUnique({ where: { id: colegioId } });
    if (!colegio) {
      res.status(404).json({ error: 'Colegio no encontrado' });
      return;
    }

    const [totalAlumnos, pagosMes, mora] = await Promise.all([
      prisma.alumno.count({ where: { colegioId, activo: true } }),
      prisma.mensualidad.count({
        where: {
          colegioId,
          estado: 'PAGADO',
          fechaPago: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.mensualidad.count({
        where: { colegioId, estado: 'VENCIDO' },
      }),
    ]);

    res.json({
      colegio: {
        id: colegio.id,
        nombre: colegio.nombre,
        direccion: colegio.direccion,
        telefono: colegio.telefono,
        emailAdmin: colegio.emailAdmin,
        logoUrl: colegio.logoUrl,
        plan: colegio.plan,
        estado: colegio.estado,
        trialEndsAt: colegio.trialEndsAt,
        config: colegio.config,
        createdAt: colegio.createdAt,
      },
      stats: {
        totalAlumnos,
        pagosMes,
        mora,
      },
    });
  } catch (err) {
    next(err);
  }
});

const updateColegioSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  direccion: z.string().max(200).optional(),
  telefono: z.string().max(20).optional(),
  logoUrl: z.string().url().max(500).optional(),
  config: z.record(z.unknown()).optional(),
});

colegioRoutes.patch(
  '/colegio',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = updateColegioSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const data: Record<string, unknown> = {};
      if (body.nombre !== undefined) data.nombre = body.nombre;
      if (body.direccion !== undefined) data.direccion = body.direccion;
      if (body.telefono !== undefined) data.telefono = body.telefono;
      if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
      if (body.config !== undefined) data.config = body.config;

      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: 'No hay campos para actualizar' });
        return;
      }

      const colegio = await prisma.colegio.update({
        where: { id: colegioId },
        data,
      });

      res.json(colegio);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);
