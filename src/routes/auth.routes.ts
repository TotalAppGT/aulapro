import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { jwtSign } from '../lib/utils';
import { authMiddleware } from '../middleware/auth';
import { verifyIdToken } from '../services/firebase.service';
import { sendWelcomeEmail } from '../services/email.service';
import { validarCodigo } from '../services/afiliado.service';

export const authRoutes = Router();

// Rate limiting sencillo en memoria para login/registro (anti fuerza bruta)
const intentos = new Map<string, { count: number; reset: number }>();

function limitarIntentos(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = String((req.body && (req.body.email || req.body.idToken)) || '').slice(0, 120);
    const key = `${req.ip || req.socket.remoteAddress || 'ip'}:${email}`;
    const now = Date.now();
    const rec = intentos.get(key);
    if (!rec || now > rec.reset) {
      intentos.set(key, { count: 1, reset: now + windowMs });
      next();
      return;
    }
    rec.count += 1;
    if (rec.count > max) {
      res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
      return;
    }
    next();
  };
}

const authLimiter = limitarIntentos(10, 15 * 60 * 1000);

const registroSchema = z.object({
  nombreColegio: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  nombre: z.string().min(2).max(100),
  telefono: z.string().max(20).optional(),
  codigoReferido: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const firebaseLoginSchema = z.object({
  idToken: z.string().min(1),
  nombreColegio: z.string().min(2).max(100).optional(),
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().max(20).optional(),
  codigoReferido: z.string().max(30).optional(),
});

authRoutes.post('/firebase', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = firebaseLoginSchema.parse(req.body);

    const claims = await verifyIdToken(body.idToken);
    if (!claims?.uid || !claims.email) {
      res.status(401).json({ error: 'Token de Firebase invalido o expirado' });
      return;
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email: claims.email },
      include: { colegio: true, alumno: { select: { id: true, gradoId: true } } },
    });

    if (existingUser) {
      if (!existingUser.activo) {
        res.status(401).json({ error: 'Cuenta desactivada' });
        return;
      }
      const token = jwtSign(existingUser.id, existingUser.colegioId, existingUser.rol);
      res.json({
        token,
        usuario: {
          id: existingUser.id,
          email: existingUser.email,
          nombre: existingUser.nombre,
          rol: existingUser.rol,
          telefono: existingUser.telefono,
          avatarUrl: existingUser.avatarUrl,
          alumnoId: existingUser.alumnoId,
          gradoId: existingUser.alumno?.gradoId ?? null,
        },
        colegio: {
          id: existingUser.colegio.id,
          nombre: existingUser.colegio.nombre,
          estado: existingUser.colegio.estado,
          plan: existingUser.colegio.plan,
          logoUrl: existingUser.colegio.logoUrl,
        },
      });
      return;
    }

    if (!body.nombreColegio || !body.nombre) {
      res.status(400).json({ error: 'Requiere datos de registro para completar la cuenta' });
      return;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const afiliado = await validarCodigo(body.codigoReferido);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const colegio = await tx.colegio.create({
        data: {
          nombre: body.nombreColegio!,
          emailAdmin: claims.email!,
          estado: 'TRIAL',
          trialEndsAt,
          afiliadoId: afiliado?.id ?? null,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          colegioId: colegio.id,
          email: claims.email!,
          passwordHash: 'firebase-auth',
          rol: 'ADMIN_COLEGIO',
          nombre: body.nombre!,
          telefono: body.telefono || null,
        },
      });

      return { colegio, usuario };
    });

    const token = jwtSign(result.usuario.id, result.colegio.id, 'ADMIN_COLEGIO');
    sendWelcomeEmail(claims.email!, result.colegio.nombre, body.nombre!);

    res.status(201).json({
      token,
      usuario: {
        id: result.usuario.id,
        email: result.usuario.email,
        nombre: result.usuario.nombre,
        rol: result.usuario.rol,
      },
      colegio: {
        id: result.colegio.id,
        nombre: result.colegio.nombre,
        estado: result.colegio.estado,
        trialEndsAt: result.colegio.trialEndsAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});

authRoutes.post('/registro', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registroSchema.parse(req.body);

    const existingUser = await prisma.usuario.findUnique({ where: { email: body.email } });
    if (existingUser) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const passwordHash = await bcrypt.hash(body.password, 10);

    const afiliado = await validarCodigo(body.codigoReferido);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const colegio = await tx.colegio.create({
        data: {
          nombre: body.nombreColegio,
          emailAdmin: body.email,
          estado: 'TRIAL',
          trialEndsAt,
          afiliadoId: afiliado?.id ?? null,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          colegioId: colegio.id,
          email: body.email,
          passwordHash,
          rol: 'ADMIN_COLEGIO',
          nombre: body.nombre,
          telefono: body.telefono || null,
        },
      });

      return { colegio, usuario };
    });

    const token = jwtSign(result.usuario.id, result.colegio.id, 'ADMIN_COLEGIO');

    sendWelcomeEmail(body.email, result.colegio.nombre, body.nombre);

    res.status(201).json({
      token,
      usuario: {
        id: result.usuario.id,
        email: result.usuario.email,
        nombre: result.usuario.nombre,
        rol: result.usuario.rol,
      },
      colegio: {
        id: result.colegio.id,
        nombre: result.colegio.nombre,
        estado: result.colegio.estado,
        trialEndsAt: result.colegio.trialEndsAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});

authRoutes.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);

    const usuario = await prisma.usuario.findUnique({
      where: { email: body.email },
      include: { colegio: true, alumno: { select: { id: true, gradoId: true } } },
    });

    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const passwordValid = await bcrypt.compare(body.password, usuario.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwtSign(usuario.id, usuario.colegioId, usuario.rol);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        telefono: usuario.telefono,
        avatarUrl: usuario.avatarUrl,
        alumnoId: usuario.alumnoId,
        gradoId: usuario.alumno?.gradoId ?? null,
      },
      colegio: {
        id: usuario.colegio.id,
        nombre: usuario.colegio.nombre,
        estado: usuario.colegio.estado,
        plan: usuario.colegio.plan,
        logoUrl: usuario.colegio.logoUrl,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});

authRoutes.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
      include: { colegio: true, alumno: { select: { id: true, gradoId: true } } },
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        telefono: usuario.telefono,
        avatarUrl: usuario.avatarUrl,
        colegioId: usuario.colegioId,
        alumnoId: usuario.alumnoId,
        gradoId: usuario.alumno?.gradoId ?? null,
      },
      colegio: {
        id: usuario.colegio.id,
        nombre: usuario.colegio.nombre,
        direccion: usuario.colegio.direccion,
        telefono: usuario.colegio.telefono,
        emailAdmin: usuario.colegio.emailAdmin,
        logoUrl: usuario.colegio.logoUrl,
        plan: usuario.colegio.plan,
        estado: usuario.colegio.estado,
        trialEndsAt: usuario.colegio.trialEndsAt,
        config: usuario.colegio.config,
      },
    });
  } catch (err) {
    next(err);
  }
});

