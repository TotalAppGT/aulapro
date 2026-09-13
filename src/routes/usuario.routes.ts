import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const usuarioRoutes = Router();

usuarioRoutes.use(authMiddleware);
usuarioRoutes.use(tenantMiddleware);

const ROLES_CREABLES = ['PROFESOR', 'PADRE', 'ALUMNO'] as const;

const createUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  rol: z.enum(ROLES_CREABLES),
  telefono: z.string().max(20).optional().nullable(),
});

const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  rol: z.enum(ROLES_CREABLES).optional(),
  telefono: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});

usuarioRoutes.get(
  '/',
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

usuarioRoutes.post(
  '/',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createUsuarioSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const existing = await prisma.usuario.findFirst({
        where: { colegioId, email: body.email },
      });
      if (existing) {
        res.status(409).json({ error: 'Ya existe un usuario con ese email en este colegio' });
        return;
      }

      const passwordHash = await bcrypt.hash(body.password, 10);

      const usuario = await prisma.usuario.create({
        data: {
          colegioId,
          email: body.email,
          passwordHash,
          rol: body.rol,
          nombre: body.nombre,
          telefono: body.telefono ?? null,
          activo: true,
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          telefono: true,
          activo: true,
          createdAt: true,
        },
      });

      res.status(201).json(usuario);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

usuarioRoutes.patch(
  '/:id',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const colegioId = req.user!.colegioId;
      const body = updateUsuarioSchema.parse(req.body);

      const existing = await prisma.usuario.findFirst({
        where: { id, colegioId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      if (existing.rol === 'SUPERADMIN') {
        res.status(403).json({ error: 'No puedes modificar a un super administrador' });
        return;
      }

      const data: Record<string, unknown> = {};
      if (body.nombre !== undefined) data.nombre = body.nombre;
      if (body.rol !== undefined) data.rol = body.rol;
      if (body.telefono !== undefined) data.telefono = body.telefono ?? null;
      if (body.activo !== undefined) data.activo = body.activo;
      if (body.password !== undefined) data.passwordHash = await bcrypt.hash(body.password, 10);

      const usuario = await prisma.usuario.update({
        where: { id },
        data,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          telefono: true,
          activo: true,
          createdAt: true,
        },
      });

      res.json(usuario);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);
