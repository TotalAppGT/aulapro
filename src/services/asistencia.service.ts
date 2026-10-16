import { prisma } from '../lib/prisma';
import { sendAttendanceReportEmail } from './email.service';

export interface AsistenciaConfig {
  activo: boolean;
  horaInicioClases: string;
  toleranciaMin: number;
  horaReporte: string;
  umbralBimestre: number;
  notificarInjustificadas: boolean;
}

export const ASISTENCIA_DEFAULT: AsistenciaConfig = {
  activo: true,
  horaInicioClases: '07:00',
  toleranciaMin: 120,
  horaReporte: '10:00',
  umbralBimestre: 3,
  notificarInjustificadas: true,
};

export function getAsistenciaConfig(config: unknown): AsistenciaConfig {
  const base = (config && typeof config === 'object' ? (config as any).asistencia : null) || {};
  return { ...ASISTENCIA_DEFAULT, ...base };
}

function toMin(hhmm: string): number {
  const [h, m] = String(hhmm || '07:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fechaKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Marca ausentes automaticamente despues de la tolerancia configurada y
 * envia (a la hora configurada) el reporte de faltas INJUSTIFICADAS a los
 * responsables, consolidado por dia. Todo por colegio (config dinamica).
 */
export async function runAutoAsistencia(): Promise<{ marcados: number; reportes: number }> {
  const now = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay();
  const hoy = new Date(now);
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy.getTime() + 86400000);
  const hoyKey = fechaKey(now);

  let marcados = 0;
  let reportes = 0;

  const colegios = await prisma.colegio.findMany({ where: { estado: { in: ['ACTIVE', 'TRIAL'] } } });

  for (const colegio of colegios) {
    const cfg = getAsistenciaConfig(colegio.config);
    const rawCfg: any = colegio.config || {};

    if (!cfg.activo) continue;
    if (weekday === 6 || weekday === 7) continue;

    const horariosHoy = await prisma.horario.findMany({
      where: { colegioId: colegio.id, diaSemana: weekday },
      select: { horaInicio: true },
    });
    if (horariosHoy.length === 0) continue;

    const primeraHora = Math.min(toMin(cfg.horaInicioClases), ...horariosHoy.map((h) => toMin(h.horaInicio)));
    const cutoff = primeraHora + cfg.toleranciaMin;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // 1) Auto-marcar ausentes (una sola vez: solo faltantes sin registro hoy)
    if (nowMin >= cutoff) {
      const admin = await prisma.usuario.findFirst({
        where: { colegioId: colegio.id, rol: 'ADMIN_COLEGIO', activo: true },
        select: { id: true },
      });
      const alumnos = await prisma.alumno.findMany({
        where: { colegioId: colegio.id, activo: true },
        select: { id: true },
      });
      const registrados = await prisma.asistencia.findMany({
        where: { colegioId: colegio.id, fecha: { gte: hoy, lt: finHoy } },
        select: { alumnoId: true },
      });
      const registradosSet = new Set(registrados.map((a) => a.alumnoId));
      const faltantes = alumnos.filter((a) => !registradosSet.has(a.id));

      if (faltantes.length > 0 && admin) {
        await prisma.asistencia.createMany({
          data: faltantes.map((a) => ({
            colegioId: colegio.id,
            alumnoId: a.id,
            materiaId: null,
            fecha: hoy,
            estado: 'AUSENTE',
            justificacion: null,
            registradoPor: admin.id,
          })),
        });
        marcados += faltantes.length;
        console.log(`[Asistencia] ${colegio.nombre}: ${faltantes.length} ausentes marcados automaticamente`);
      }
    }

    // 2) Reporte de fin de manana (una sola vez al dia)
    if (nowMin >= toMin(cfg.horaReporte) && cfg.notificarInjustificadas && rawCfg.asistencia?.ultimoReporte !== hoyKey) {
      const ausentes = await prisma.asistencia.findMany({
        where: {
          colegioId: colegio.id,
          fecha: { gte: hoy, lt: finHoy },
          estado: 'AUSENTE',
          justificacion: null,
        },
        include: {
          alumno: {
            select: {
              nombre: true,
              apellido: true,
              grado: { select: { nombre: true } },
              responsable: { select: { nombre: true, email: true } },
            },
          },
        },
      });

      const porEmail = new Map<string, { responsable: string; hijos: { alumno: string; grado: string }[] }>();
      for (const a of ausentes) {
        const email = a.alumno.responsable?.email;
        if (!email) continue;
        if (!porEmail.has(email)) {
          porEmail.set(email, { responsable: a.alumno.responsable?.nombre || '', hijos: [] });
        }
        porEmail.get(email)!.hijos.push({
          alumno: `${a.alumno.nombre} ${a.alumno.apellido || ''}`.trim(),
          grado: a.alumno.grado?.nombre || '-',
        });
      }

      for (const [email, data] of porEmail) {
        try {
          await sendAttendanceReportEmail(email, {
            colegio: colegio.nombre,
            fecha: hoyKey,
            responsable: data.responsable,
            hijos: data.hijos,
          });
          reportes++;
        } catch (err) {
          console.error('[Asistencia] Fallo reporte a', email, err);
        }
      }

      await prisma.colegio.update({
        where: { id: colegio.id },
        data: { config: { ...rawCfg, asistencia: { ...(rawCfg.asistencia || {}), ...cfg, ultimoReporte: hoyKey } } },
      });
    }
  }

  return { marcados, reportes };
}
