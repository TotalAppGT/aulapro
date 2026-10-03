import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export const provisionRoutes = Router();

// Alta automatica de colegio (Total Suite). Protegido por PROVISION_SECRET.
provisionRoutes.post('/', async (req: Request, res: Response) => {
  if (req.headers['x-provision-secret'] !== (process.env.PROVISION_SECRET || '__none__')) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  const b = req.body || {};
  const nombre = b.nombre || b.nombreColegio;
  const email = b.admin_email || b.email;
  const password = b.admin_password || b.password;
  if (!nombre || !email || !password) {
    res.status(400).json({ ok: false, error: 'faltan datos' });
    return;
  }
  const planMap: Record<string, 'STARTER' | 'PRO' | 'BUSINESS'> = {
    colegio: 'STARTER',
    colegio_plus: 'PRO',
    red: 'BUSINESS',
  };
  try {
    const colegio = await prisma.colegio.create({
      data: {
        nombre,
        emailAdmin: String(email).toLowerCase(),
        telefono: b.telefono || null,
        direccion: b.direccion || null,
        plan: planMap[String(b.plan || 'colegio').toLowerCase()] || 'STARTER',
        estado: 'ACTIVE',
      },
    });
    try {
      await prisma.usuario.create({
        data: {
          colegioId: colegio.id,
          email: String(email).toLowerCase(),
          passwordHash: await bcrypt.hash(password, 10),
          rol: 'ADMIN_COLEGIO',
          nombre,
          activo: true,
        },
      });
    } catch {
      // el correo ya existia; el colegio quedo creado igual
    }
    console.log('[PROVISION] Colegio creado:', nombre, email);
    res.json({ ok: true, colegio_id: colegio.id });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'error' });
  }
});
