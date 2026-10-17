import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { jwtSign } from '../lib/utils';
import { authMiddleware } from '../middleware/auth';
import { crearAfiliado, generarComisionesAfiliados } from '../services/afiliado.service';

export const afiliadoRoutes = Router();

const intentos = new Map<string, { count: number; reset: number }>();
function limitar(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'ip'}:${(req.body && req.body.email) || ''}`;
    const now = Date.now();
    const rec = intentos.get(key);
    if (!rec || now > rec.reset) {
      intentos.set(key, { count: 1, reset: now + windowMs });
      next();
      return;
    }
    rec.count += 1;
    if (rec.count > max) {
      res.status(429).json({ error: 'Demasiados intentos. Intenta mas tarde.' });
      return;
    }
    next();
  };
}
const afiliadoLimiter = limitar(10, 15 * 60 * 1000);

function sesionAfiliado(a: { id: string; email: string; nombre: string; codigo: string }) {
  return {
    token: jwtSign(a.id, '', 'AFILIADO'),
    usuario: {
      id: a.id,
      email: a.email,
      nombre: a.nombre,
      rol: 'AFILIADO',
      telefono: null,
      avatarUrl: null,
      alumnoId: null,
      gradoId: null,
    },
    colegio: {
      id: '',
      nombre: 'Programa de Afiliados',
      estado: 'ACTIVE',
      plan: 'PRO',
      logoUrl: null,
    },
    codigo: a.codigo,
  };
}

function requireAfiliado(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.rol !== 'AFILIADO') {
    res.status(403).json({ error: 'Solo para afiliados' });
    return;
  }
  next();
}

const registroSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

afiliadoRoutes.post('/registro', afiliadoLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registroSchema.parse(req.body);
    const existente = await prisma.afiliado.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existente) {
      res.status(409).json({ error: 'Ese correo ya esta registrado como afiliado' });
      return;
    }
    const afiliado = await crearAfiliado(body);
    res.status(201).json(sesionAfiliado(afiliado));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos invalidos', details: err.errors });
      return;
    }
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

afiliadoRoutes.post('/login', afiliadoLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const afiliado = await prisma.afiliado.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!afiliado || !afiliado.activo) {
      res.status(401).json({ error: 'Credenciales invalidas' });
      return;
    }
    const ok = await bcrypt.compare(body.password, afiliado.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Credenciales invalidas' });
      return;
    }
    res.json(sesionAfiliado(afiliado));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos invalidos', details: err.errors });
      return;
    }
    next(err);
  }
});

afiliadoRoutes.get('/me', authMiddleware, requireAfiliado, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const afiliadoId = req.user!.userId;
    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const afiliado = await prisma.afiliado.findUnique({ where: { id: afiliadoId } });
    if (!afiliado) {
      res.status(404).json({ error: 'Afiliado no encontrado' });
      return;
    }

    const [colegios, comisiones] = await Promise.all([
      prisma.colegio.findMany({
        where: { afiliadoId },
        select: { id: true, nombre: true, plan: true, estado: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comisionAfiliado.findMany({
        where: { afiliadoId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, colegioId: true, periodo: true, monto: true, estado: true, createdAt: true },
      }),
    ]);

    const comisionMes = comisiones.filter((c) => c.periodo === periodo).reduce((s, c) => s + c.monto, 0);
    const comisionTotal = comisiones.reduce((s, c) => s + c.monto, 0);
    const pendiente = comisiones.filter((c) => c.estado === 'PENDIENTE').reduce((s, c) => s + c.monto, 0);
    const activos = colegios.filter((c) => c.estado === 'ACTIVE' || c.estado === 'TRIAL').length;

    res.json({
      afiliado: {
        id: afiliado.id,
        nombre: afiliado.nombre,
        email: afiliado.email,
        codigo: afiliado.codigo,
        comisionPct: afiliado.comisionPct,
      },
      periodo,
      stats: { referidos: colegios.length, activos, comisionMes, comisionTotal, pendiente },
      colegios,
      comisiones,
    });
  } catch (err) {
    next(err);
  }
});

afiliadoRoutes.get('/referidos', authMiddleware, requireAfiliado, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegios = await prisma.colegio.findMany({
      where: { afiliadoId: req.user!.userId },
      select: { id: true, nombre: true, plan: true, estado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(colegios);
  } catch (err) {
    next(err);
  }
});

afiliadoRoutes.get('/comisiones', authMiddleware, requireAfiliado, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comisiones = await prisma.comisionAfiliado.findMany({
      where: { afiliadoId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comisiones);
  } catch (err) {
    next(err);
  }
});

// (uso interno) recalcula comisiones del mes
afiliadoRoutes.post('/recalcular', authMiddleware, requireAfiliado, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const n = await generarComisionesAfiliados();
    res.json({ actualizadas: n });
  } catch (err) {
    next(err);
  }
});
