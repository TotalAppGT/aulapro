import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { planDe } from '../lib/planes';

export function generarCodigoAfiliado(nombre: string): string {
  const base = (nombre || 'AFIL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8) || 'AFIL';
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${base}${suffix}`;
}

export async function validarCodigo(codigo: string | null | undefined) {
  if (!codigo) return null;
  const afiliado = await prisma.afiliado.findUnique({
    where: { codigo: codigo.trim().toUpperCase() },
    select: { id: true, activo: true },
  });
  return afiliado?.activo ? afiliado : null;
}

export async function crearAfiliado(data: { nombre: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  let codigo = generarCodigoAfiliado(data.nombre);

  // garantizar codigo unico
  for (let i = 0; i < 5; i++) {
    const existe = await prisma.afiliado.findUnique({ where: { codigo } });
    if (!existe) break;
    codigo = generarCodigoAfiliado(data.nombre);
  }

  return prisma.afiliado.create({
    data: { nombre: data.nombre, email: data.email.toLowerCase(), passwordHash, codigo, comisionPct: 25 },
  });
}

/**
 * Genera (idempotente) las comisiones del mes actual para los colegios
 * referidos por cada afiliado activo. La suscripcion es por establecimiento.
 */
export async function generarComisionesAfiliados(): Promise<number> {
  const now = new Date();
  const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const colegios = await prisma.colegio.findMany({
    where: { afiliadoId: { not: null }, estado: { in: ['ACTIVE', 'TRIAL'] } },
    select: { id: true, plan: true, afiliadoId: true },
  });

  let generadas = 0;
  for (const c of colegios) {
    if (!c.afiliadoId) continue;
    const afiliado = await prisma.afiliado.findUnique({
      where: { id: c.afiliadoId },
      select: { comisionPct: true, activo: true },
    });
    if (!afiliado?.activo) continue;

    const monto = Math.round(planDe(c.plan).precio * (afiliado.comisionPct / 100) * 100) / 100;

    await prisma.comisionAfiliado.upsert({
      where: {
        afiliadoId_colegioId_periodo: { afiliadoId: c.afiliadoId, colegioId: c.id, periodo },
      },
      create: { afiliadoId: c.afiliadoId, colegioId: c.id, periodo, monto },
      update: { monto },
    });
    generadas++;
  }

  return generadas;
}
