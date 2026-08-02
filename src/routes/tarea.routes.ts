import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const tareaRoutes = Router();

tareaRoutes.use(authMiddleware);
tareaRoutes.use(tenantMiddleware);

const tareaSchema = z.object({
  gradoId: z.string().min(1),
  materia: z.string().min(1).max(200),
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(2000).optional(),
  fechaEntrega: z.string().min(1),
  tipo: z.string().max(50).default('tarea'),
  archivos: z.array(z.string()).default([]),
});

tareaRoutes.post(
  '/',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = tareaSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const grado = await prisma.grado.findFirst({
        where: { id: body.gradoId, colegioId, activo: true },
      });
      if (!grado) {
        res.status(404).json({ error: 'Grado no encontrado' });
        return;
      }

      const tarea = await prisma.tarea.create({
        data: {
          colegioId,
          gradoId: body.gradoId,
          materia: body.materia,
          titulo: body.titulo,
          descripcion: body.descripcion || null,
          fechaEntrega: new Date(body.fechaEntrega),
          tipo: body.tipo,
          archivos: body.archivos,
          creadoPor: req.user!.userId,
        },
      });

      res.status(201).json(tarea);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

tareaRoutes.get(
  '/grado/:gradoId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gradoId } = req.params;
      const colegioId = req.user!.colegioId;

      const tareas = await prisma.tarea.findMany({
        where: { colegioId, gradoId },
        include: {
          creador: { select: { id: true, nombre: true } },
          _count: { select: { entregas: true } },
        },
        orderBy: { fechaEntrega: 'desc' },
      });

      res.json(tareas);
    } catch (err) {
      next(err);
    }
  }
);

tareaRoutes.get(
  '/alumno/:alumnoId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alumnoId } = req.params;
      const colegioId = req.user!.colegioId;

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, colegioId, activo: true },
      });

      if (!alumno || !alumno.gradoId) {
        res.status(404).json({ error: 'Alumno no encontrado o sin grado asignado' });
        return;
      }

      const tareas = await prisma.tarea.findMany({
        where: { colegioId, gradoId: alumno.gradoId },
        orderBy: { fechaEntrega: 'desc' },
      });

      const tareaIds = tareas.map((t: { id: string }) => t.id);

      const entregas = await prisma.entregaTarea.findMany({
        where: {
          colegioId,
          alumnoId,
          tareaId: { in: tareaIds },
        },
      });

      type EntregaInfo = { id: string; estado: string; archivos: string[]; nota: number | null; fechaEntrega: Date | null };
      const entregasMap = new Map<string, EntregaInfo>(entregas.map((e: EntregaInfo & { tareaId: string }) => [e.tareaId, e]));
      const result = tareas.map((tarea: any) => {
        const entrega = entregasMap.get(tarea.id);
        return {
          ...tarea,
          entrega: entrega
            ? {
                id: entrega.id,
                estado: entrega.estado,
                archivos: entrega.archivos,
                nota: entrega.nota,
                fechaEntrega: entrega.fechaEntrega,
              }
            : null,
        };
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

const entregaSchema = z.object({
  archivos: z.array(z.string()).default([]),
  alumnoId: z.string().optional(),
});

tareaRoutes.post(
  '/:tareaId/entregar',
  requireRole('ALUMNO', 'PADRE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = entregaSchema.parse(req.body);
      const { tareaId } = req.params;
      const colegioId = req.user!.colegioId;

      const tarea = await prisma.tarea.findFirst({
        where: { id: tareaId, colegioId },
      });
      if (!tarea) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }

      const alumno = await prisma.alumno.findFirst({
        where: {
          colegioId,
          gradoId: tarea.gradoId,
          activo: true,
          OR: [
            { id: (body.alumnoId as string) || '' },
            { responsableId: req.user!.userId },
          ],
        },
      });

      if (!alumno) {
        res.status(404).json({ error: 'Alumno no encontrado en este grado' });
        return;
      }

      const existing = await prisma.entregaTarea.findFirst({
        where: { tareaId, alumnoId: alumno.id, colegioId },
      });

      if (existing && existing.estado !== 'PENDIENTE') {
        res.status(400).json({ error: 'Ya entregaste esta tarea' });
        return;
      }

      const now = new Date();
      const estado = tarea.fechaEntrega < now ? 'TARDE' : 'ENTREGADO';

      const entrega = existing
        ? await prisma.entregaTarea.update({
            where: { id: existing.id },
            data: {
              estado,
              archivos: body.archivos,
              fechaEntrega: now,
            },
          })
        : await prisma.entregaTarea.create({
            data: {
              colegioId,
              tareaId,
              alumnoId: alumno.id,
              estado,
              archivos: body.archivos,
              fechaEntrega: now,
            },
          });

      res.status(201).json(entrega);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);
