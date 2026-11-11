import { runDueNotifications } from '../services/notification.service';
import { runAutoAsistencia } from '../services/asistencia.service';
import { generarComisionesAfiliados } from '../services/afiliado.service';
import { procesarVencimientos } from '../lib/vencimientos';

let interval: NodeJS.Timeout | null = null;
let ultimoDiaComision = '';
let ultimaHoraVencimiento = '';

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

    try {
      const hoyKey = new Date().toISOString().slice(0, 10);
      if (ultimoDiaComision !== hoyKey) {
        ultimoDiaComision = hoyKey;
        const n = await generarComisionesAfiliados();
        if (n > 0) console.log(`[Scheduler] Comisiones de afiliados calculadas: ${n}`);
      }
    } catch (err) {
      console.error('[Scheduler] Error comisiones afiliados:', err);
    }

    try {
      const horaKey = new Date().toISOString().slice(0, 13);
      if (ultimaHoraVencimiento !== horaKey) {
        ultimaHoraVencimiento = horaKey;
        const { avisos, suspendidos } = await procesarVencimientos();
        if (avisos > 0 || suspendidos > 0) {
          console.log(`[Scheduler] Vencimientos: ${suspendidos} suspendidos, ${avisos} avisos.`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error vencimientos:', err);
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
