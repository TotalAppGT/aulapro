export interface PlanConfig {
  precio: number; // Q por establecimiento / mes
  maxAlumnos: number | null;
  maxUsuarios: number | null;
}

export const PLANES: Record<string, PlanConfig> = {
  STARTER: { precio: 149, maxAlumnos: 100, maxUsuarios: 15 },
  PRO: { precio: 349, maxAlumnos: 400, maxUsuarios: 60 },
  BUSINESS: { precio: 599, maxAlumnos: null, maxUsuarios: null },
};

export function planDe(plan: string | null | undefined): PlanConfig {
  return PLANES[plan || 'STARTER'] ?? PLANES.STARTER;
}

export const MESES_GRATIS_ANUAL = 2;

export function precioAnual(plan: string | null | undefined): number {
  const p = planDe(plan).precio;
  return p * (12 - MESES_GRATIS_ANUAL);
}

export interface Cupon {
  codigo: string;
  tipo: 'porcentaje' | 'trial';
  valor: number;
  dias?: number;
  planTrial?: string;
  activo: boolean;
  descripcion: string;
}

export const CUPONES: Record<string, Cupon> = {
  BIENVENIDA: {
    codigo: 'BIENVENIDA',
    tipo: 'trial',
    valor: 100,
    dias: 30,
    planTrial: 'PRO',
    activo: true,
    descripcion: '30 dias gratis en plan Pro',
  },
  LANZAMIENTO20: {
    codigo: 'LANZAMIENTO20',
    tipo: 'porcentaje',
    valor: 20,
    activo: true,
    descripcion: '20% de descuento en el primer pago',
  },
};

export function buscarCupon(codigo: string | null | undefined): Cupon | null {
  if (!codigo) return null;
  const c = CUPONES[String(codigo).trim().toUpperCase()];
  return c && c.activo ? c : null;
}
