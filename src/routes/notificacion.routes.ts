import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { computeNextRun, enviarNotificacion } from '../services/notification.service';

export const notificacionRoutes = Router();

notificacionRoutes.use(authMiddleware);
notificacionRoutes.use(tenantMiddleware);

const notificacionSchema = z.object({
  titulo: z.string().min(2).max(200),
  mensaje: z.string().min(2).max(2000),
  canal: z.enum(['WHATSAPP', 'EMAIL']).default('WHATSAPP'),
  frecuencia: z.enum(['UNA_SOLA_VEZ', 'DIARIA', 'SEMANAL', 'MENSUAL']).default('UNA_SOLA_VEZ'),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  diaSemana: z.number().int().min(1).max(7).optional().nullable(),
  diaMes: z.number().int().min(1).max(31).optional().nullable(),
  roles: z.array(z.string()).default([]),
  telefonos: z.array(z.string()).default([]),
  activa: z.boolean().default(true),
});

notificacionRoutes.get(
  '/',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;

      const notificaciones = await prisma.notificacionProgramada.findMany({
        where: { colegioId },
        include: { creador: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'desc' },
      });

      res.json(notificaciones);
    } catch (err) {
      next(err);
    }
  }
);

notificacionRoutes.post(
  '/',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = notificacionSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const proximoEnvioAt = computeNextRun({
        id: 'new',
        colegioId,
        frecuencia: body.frecuencia,
        hora: body.hora,
        diaSemana: body.diaSemana ?? null,
        diaMes: body.diaMes ?? null,
        roles: body.roles,
        telefonos: body.telefonos,
      });

      if (body.frecuencia !== 'UNA_SOLA_VEZ' && !proximoEnvioAt) {
        res.status(400).json({ error: 'No se pudo calcular la próxima ejecución con los datos dados' });
        return;
      }

      const notificacion = await prisma.notificacionProgramada.create({
        data: {
          colegioId,
          titulo: body.titulo,
          mensaje: body.mensaje,
          canal: body.canal,
          frecuencia: body.frecuencia,
          hora: body.hora,
          diaSemana: body.diaSemana ?? null,
          diaMes: body.diaMes ?? null,
          roles: body.roles,
          telefonos: body.telefonos,
          activa: body.activa,
          proximoEnvioAt: proximoEnvioAt || null,
          creadoPor: req.user!.userId,
        },
      });

      res.status(201).json(notificacion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

notificacionRoutes.patch(
  '/:id',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const colegioId = req.user!.colegioId;
      const body = notificacionSchema.partial().parse(req.body);

      const existing = await prisma.notificacionProgramada.findFirst({
        where: { id, colegioId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      const data: Record<string, unknown> = { ...body };
      if (body.titulo !== undefined) data.titulo = body.titulo;
      if (body.mensaje !== undefined) data.mensaje = body.mensaje;
      if (body.canal !== undefined) data.canal = body.canal;
      if (body.frecuencia !== undefined) data.frecuencia = body.frecuencia;
      if (body.hora !== undefined) data.hora = body.hora;
      if (body.diaSemana !== undefined) data.diaSemana = body.diaSemana ?? null;
      if (body.diaMes !== undefined) data.diaMes = body.diaMes ?? null;
      if (body.roles !== undefined) data.roles = body.roles;
      if (body.telefonos !== undefined) data.telefonos = body.telefonos;
      if (body.activa !== undefined) data.activa = body.activa;

      if (body.frecuencia !== undefined || body.hora !== undefined || body.diaSemana !== undefined || body.diaMes !== undefined) {
        const next = computeNextRun({
          id: existing.id,
          colegioId,
          frecuencia: body.frecuencia || existing.frecuencia,
          hora: body.hora || existing.hora,
          diaSemana: body.diaSemana !== undefined ? body.diaSemana ?? null : existing.diaSemana,
          diaMes: body.diaMes !== undefined ? body.diaMes ?? null : existing.diaMes,
          roles: body.roles || existing.roles,
          telefonos: body.telefonos || existing.telefonos,
        });
        data.proximoEnvioAt = next;
      }

      const notificacion = await prisma.notificacionProgramada.update({
        where: { id },
        data,
      });

      res.json(notificacion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

notificacionRoutes.post(
  '/:id/enviar-ahora',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const colegioId = req.user!.colegioId;

      const notif = await prisma.notificacionProgramada.findFirst({
        where: { id, colegioId },
      });
      if (!notif) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      const resultado = await enviarNotificacion({
        id: notif.id,
        colegioId: notif.colegioId,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        canal: notif.canal,
        roles: notif.roles,
        telefonos: notif.telefonos,
      });

      res.json({ message: 'Envío ejecutado', resultado });
    } catch (err) {
      next(err);
    }
  }
);

notificacionRoutes.delete(
  '/:id',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const colegioId = req.user!.colegioId;

      const existing = await prisma.notificacionProgramada.findFirst({
        where: { id, colegioId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Notificación no encontrada' });
        return;
      }

      await prisma.notificacionProgramada.delete({ where: { id } });

      res.json({ message: 'Notificación eliminada' });
    } catch (err) {
      next(err);
    }
  }
);
