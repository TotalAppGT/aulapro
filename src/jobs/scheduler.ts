import { runDueNotifications } from '../services/notification.service';
import { runAutoAsistencia } from '../services/asistencia.service';

let interval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  if (interval) return;

  const tick = async () => {
    try {
      const count = await runDueNotifications();
      if (count > 0) {
        console.log(`[Scheduler] ${count} notificacion(es) programada(s) enviadas.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error notificaciones:', err);
    }

    try {
      const { marcados, reportes } = await runAutoAsistencia();
      if (marcados > 0 || reportes > 0) {
        console.log(`[Scheduler] Asistencia: ${marcados} ausentes marcados, ${reportes} reportes enviados.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error asistencia:', err);
    }
  };

  tick();
  interval = setInterval(tick, 60_000);
  console.log('[Scheduler] Iniciado (cada 60s)');
}

export function stopScheduler(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
