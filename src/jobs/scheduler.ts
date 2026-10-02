import { runDueNotifications } from '../services/notification.service';

let interval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  // Interruptor de migracion: evita duplicar notificaciones al correr en paralelo.
  if (process.env.DISABLE_CRON === 'true') {
    console.log('[Scheduler] Desactivado (DISABLE_CRON=true)');
    return;
  }

  if (interval) return;

  const tick = async () => {
    try {
      const count = await runDueNotifications();
      if (count > 0) {
        console.log(`[Scheduler] ${count} notificacion(es) programada(s) enviadas.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error:', err);
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
