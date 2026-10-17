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
