import { prisma } from '../lib/prisma';
import { sendTemplateMessage } from './whatsapp.service';
import { sendNotificationEmail } from './email.service';

type Frecuencia = 'UNA_SOLA_VEZ' | 'DIARIA' | 'SEMANAL' | 'MENSUAL';

interface Notif {
  id: string;
  colegioId: string;
  frecuencia: Frecuencia;
  hora: string;
  diaSemana: number | null;
  diaMes: number | null;
  roles: string[];
  telefonos: string[];
}

export function computeNextRun(n: Notif, from: Date = new Date()): Date | null {
  const [h, m] = n.hora.split(':').map(Number);
  const next = new Date(from);
  next.setSeconds(0, 0);

  if (n.frecuencia === 'UNA_SOLA_VEZ') {
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= from.getTime()) return null;
    return next;
  }

  if (n.frecuencia === 'DIARIA') {
    next.setHours(h, m, 0, 0);
    if (next.getTime() <= from.getTime()) next.setDate(next.getDate() + 1);
    return next;
  }

  if (n.frecuencia === 'SEMANAL') {
    const target = n.diaSemana ?? 1; // 1=Mon
    for (let i = 0; i < 8; i++) {
      const candidate = new Date(from);
      candidate.setDate(from.getDate() + i);
      candidate.setHours(h, m, 0, 0);
      const jsDay = candidate.getDay(); // 0=Sun
      const prismaDay = jsDay === 0 ? 7 : jsDay;
      if (prismaDay === target && candidate.getTime() > from.getTime()) return candidate;
    }
  }

  if (n.frecuencia === 'MENSUAL') {
    const target = Math.min(n.diaMes ?? 1, 28);
    for (let i = 0; i < 62; i++) {
      const candidate = new Date(from);
      candidate.setDate(from.getDate() + i);
      candidate.setHours(h, m, 0, 0);
      if (candidate.getDate() === target && candidate.getTime() > from.getTime()) return candidate;
    }
  }

  return null;
}

async function collectDestinatarios(colegioId: string, roles: string[], telefonos: string[]): Promise<string[]> {
  const numeros = new Set<string>();

  for (const t of telefonos) {
    const limpio = t.trim();
    if (limpio) numeros.add(limpio);
  }

  if (roles.includes('PADRE')) {
    const padres = await prisma.usuario.findMany({
      where: { colegioId, rol: 'PADRE', activo: true, telefono: { not: null } },
      select: { telefono: true },
    });
    padres.forEach((p) => p.telefono && numeros.add(p.telefono));
  }

  if (roles.includes('PROFESOR')) {
    const profs = await prisma.usuario.findMany({
      where: { colegioId, rol: 'PROFESOR', activo: true, telefono: { not: null } },
      select: { telefono: true },
    });
    profs.forEach((p) => p.telefono && numeros.add(p.telefono));
  }

  if (roles.includes('ADMIN_COLEGIO')) {
    const admins = await prisma.usuario.findMany({
      where: { colegioId, rol: 'ADMIN_COLEGIO', activo: true, telefono: { not: null } },
      select: { telefono: true },
    });
    admins.forEach((p) => p.telefono && numeros.add(p.telefono));
  }

  if (roles.includes('ALUMNO')) {
    const alumnos = await prisma.alumno.findMany({
      where: { colegioId, activo: true, responsable: { telefono: { not: null } } },
      select: { responsable: { select: { telefono: true } } },
    });
    alumnos.forEach((a) => a.responsable?.telefono && numeros.add(a.responsable.telefono));
  }

  if (roles.length === 0 && telefonos.length === 0) {
    const todos = await prisma.usuario.findMany({
      where: { colegioId, activo: true, telefono: { not: null } },
      select: { telefono: true },
    });
    todos.forEach((p) => p.telefono && numeros.add(p.telefono));
  }

  return Array.from(numeros);
}

async function collectEmails(colegioId: string, roles: string[]): Promise<string[]> {
  const emails = new Set<string>();

  if (roles.length === 0) {
    const todos = await prisma.usuario.findMany({
      where: { colegioId, activo: true },
      select: { email: true },
    });
    todos.forEach((p) => p.email && emails.add(p.email));
    return Array.from(emails);
  }

  const buscados = roles.filter((r) => r !== 'ALUMNO');
  if (buscados.length > 0) {
    const usuarios = await prisma.usuario.findMany({
      where: { colegioId, rol: { in: buscados as any }, activo: true },
      select: { email: true },
    });
    usuarios.forEach((p) => p.email && emails.add(p.email));
  }

  if (roles.includes('ALUMNO')) {
    const alumnos = await prisma.alumno.findMany({
      where: { colegioId, activo: true, responsable: { isNot: null } },
      select: { responsable: { select: { email: true } } },
    });
    alumnos.forEach((a) => a.responsable?.email && emails.add(a.responsable.email));
  }

  return Array.from(emails);
}

export async function enviarNotificacion(notif: {
  id: string;
  colegioId: string;
  titulo: string;
  mensaje: string;
  canal?: string;
  roles: string[];
  telefonos: string[];
}) {
  const canal = (notif.canal || 'WHATSAPP').toUpperCase();

  if (canal === 'EMAIL') {
    const emails = await collectEmails(notif.colegioId, notif.roles);
    let enviados = 0;
    const errores: string[] = [];

    for (const email of emails) {
      try {
        await sendNotificationEmail(email, notif.titulo, notif.mensaje);
        enviados++;
      } catch (err) {
        errores.push(email);
        console.error(`[Notificacion ${notif.id}] Fallo email a ${email}:`, err);
      }
    }

    return { destinatarios: emails.length, enviados, errores };
  }

  const numeros = await collectDestinatarios(notif.colegioId, notif.roles, notif.telefonos);

  let enviados = 0;
  const errores: string[] = [];

  for (const numero of numeros) {
    try {
      await sendTemplateMessage(numero, notif.titulo, notif.mensaje);
      enviados++;
    } catch (err) {
      errores.push(numero);
      console.error(`[Notificacion ${notif.id}] Fallo envio a ${numero}:`, err);
    }
  }

  return { destinatarios: numeros.length, enviados, errores };
}

export async function runDueNotifications(): Promise<number> {
  const now = new Date();

  const due = await prisma.notificacionProgramada.findMany({
    where: { activa: true, proximoEnvioAt: { lte: now } },
  });

  let procesadas = 0;

  for (const notif of due) {
    try {
      await enviarNotificacion(notif);

      const nuevaFecha = computeNextRun(notif, now);
      const activa = notif.frecuencia === 'UNA_SOLA_VEZ' ? false : nuevaFecha !== null;

      await prisma.notificacionProgramada.update({
        where: { id: notif.id },
        data: {
          ultimoEnvioAt: now,
          proximoEnvioAt: nuevaFecha,
          enviadoVeces: { increment: 1 },
          activa,
        },
      });

      procesadas++;
    } catch (err) {
      console.error(`[Notificacion ${notif.id}] Error procesando:`, err);
    }
  }

  return procesadas;
}
