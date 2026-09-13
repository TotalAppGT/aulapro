import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const mensajeRoutes = Router();

mensajeRoutes.use(authMiddleware);
mensajeRoutes.use(tenantMiddleware);

const crearMensajeSchema = z.object({
  contenido: z.string().min(1).max(2000),
});

mensajeRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const colegioId = req.user!.colegioId;

    const mensajes = await prisma.mensaje.findMany({
      where: {
        colegioId,
        OR: [{ remitenteId: userId }, { destinatarioId: userId }],
      },
      include: {
        remitente: { select: { id: true, nombre: true, rol: true } },
        destinatario: { select: { id: true, nombre: true, rol: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const recibidosIds = mensajes
      .filter((m) => m.destinatarioId === userId && !m.leido)
      .map((m) => m.id);

    if (recibidosIds.length > 0) {
      await prisma.mensaje.updateMany({
        where: { id: { in: recibidosIds } },
        data: { leido: true },
      });
    }

    res.json(mensajes);
  } catch (err) {
    next(err);
  }
});

mensajeRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = crearMensajeSchema.parse(req.body);
    const userId = req.user!.userId;
    const colegioId = req.user!.colegioId;
    const rol = req.user!.rol;

    let destinatario;
    if (rol === 'ADMIN_COLEGIO' || rol === 'SUPERADMIN') {
      res.status(400).json({ error: 'La direccion no puede enviar mensajes a si misma' });
      return;
    }

    destinatario = await prisma.usuario.findFirst({
      where: { colegioId, rol: 'ADMIN_COLEGIO', activo: true, NOT: { id: userId } },
      select: { id: true },
    });

    if (!destinatario) {
      res.status(400).json({ error: 'No hay un administrador disponible para recibir el mensaje' });
      return;
    }

    const mensaje = await prisma.mensaje.create({
      data: {
        colegioId,
        remitenteId: userId,
        destinatarioId: destinatario.id,
        contenido: body.contenido,
      },
      include: {
        remitente: { select: { id: true, nombre: true, rol: true } },
        destinatario: { select: { id: true, nombre: true, rol: true } },
      },
    });

    res.status(201).json(mensaje);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});
