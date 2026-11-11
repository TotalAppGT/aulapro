import { prisma } from './prisma';
import { sendNotificationEmail } from '../services/email.service';

const DIAS_GRACIA = 3;
const MS_DIA = 86_400_000;

function mergeConfig(actual: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = actual && typeof actual === 'object' ? (actual as Record<string, unknown>) : {};
  return { ...base, ...patch };
}

export async function extenderVigencia(colegioId: string, ciclo: string, plan?: string): Promise<Date> {
  const colegio = await prisma.colegio.findUnique({ where: { id: colegioId }, select: { config: true } });
  const cfg = (colegio?.config && typeof colegio.config === 'object' ? colegio.config : {}) as Record<string, unknown>;
  const ahora = new Date();
  const actual = cfg.planVenceAt ? new Date(String(cfg.planVenceAt)) : null;
  const base = actual && actual > ahora ? actual : ahora;
  const dias = ciclo === 'anual' ? 365 : 30;
  const vence = new Date(base.getTime() + dias * MS_DIA);

  await prisma.colegio.update({
    where: { id: colegioId },
    data: {
      estado: 'ACTIVE',
      trialEndsAt: null,
      ...(plan ? { plan: plan as any } : {}),
      config: mergeConfig(cfg, {
        planVenceAt: vence.toISOString(),
        ciclo,
        avisoVence: null,
        avisoVencido: null,
      }) as any,
    },
  });
  return vence;
}

export async function procesarVencimientos(): Promise<{ avisos: number; suspendidos: number }> {
  const ahora = new Date();
  const colegios = await prisma.colegio.findMany({
    where: { estado: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
    select: { id: true, nombre: true, emailAdmin: true, estado: true, trialEndsAt: true, config: true },
  });

  let avisos = 0;
  let suspendidos = 0;
  const appUrl = process.env.APP_URL || 'https://aulapro.totalappgt.com';

  for (const c of colegios) {
    if (!c.emailAdmin) continue;
    const cfg = (c.config && typeof c.config === 'object' ? c.config : {}) as Record<string, unknown>;
    const venceStr = c.estado === 'TRIAL' ? c.trialEndsAt?.toISOString() : (cfg.planVenceAt as string | undefined);
    if (!venceStr) continue;

    const vence = new Date(venceStr);
    if (Number.isNaN(vence.getTime())) continue;
    const dias = (vence.getTime() - ahora.getTime()) / MS_DIA;
    if (dias > DIAS_GRACIA) continue;

    if (dias <= 0) {
      const patch: Record<string, unknown> = {};
      if (c.estado !== 'PAST_DUE') patch.estado = 'PAST_DUE';
      if (!cfg.avisoVencido) {
        patch.config = mergeConfig(cfg, { avisoVencido: ahora.toISOString() });
        await sendNotificationEmail(
          c.emailAdmin,
          `Tu suscripcion de ${c.nombre} vencio`,
          `Hola,\n\nTu plan de AulaPro para ${c.nombre} vencio el ${vence.toLocaleDateString('es-GT')} y tu cuenta quedo con pago pendiente.\n\nRenueva tu plan en ${appUrl}/app/planes para recuperar el acceso completo.\n\nAulaPro`,
        );
        suspendidos++;
      }
      if (Object.keys(patch).length) {
        await prisma.colegio.update({ where: { id: c.id }, data: patch as any });
      }
    } else if (!cfg.avisoVence) {
      await prisma.colegio.update({
        where: { id: c.id },
        data: { config: mergeConfig(cfg, { avisoVence: ahora.toISOString() }) as any },
      });
      await sendNotificationEmail(
        c.emailAdmin,
        `Tu plan de ${c.nombre} vence en ${Math.ceil(dias)} dia(s)`,
        `Hola,\n\nTu plan de AulaPro para ${c.nombre} vence el ${vence.toLocaleDateString('es-GT')}.\n\nRenueva en ${appUrl}/app/planes para no perder el acceso.\n\nAulaPro`,
      );
      avisos++;
    }
  }

  return { avisos, suspendidos };
}
