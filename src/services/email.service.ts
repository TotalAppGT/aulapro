import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL } from '../config';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendInstance) resendInstance = new Resend(RESEND_API_KEY);
  return resendInstance;
}

export async function sendWelcomeEmail(to: string, nombreColegio: string, nombreAdmin: string) {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurada, se omite envio a', to);
    return;
  }
  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject: `Bienvenido a AulaPro, ${nombreColegio}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">AulaPro</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 12px">Hola ${nombreAdmin},</h2>
            <p style="color:#374151;line-height:1.6">
              Tu cuenta para <strong>${nombreColegio}</strong> esta activa con una prueba gratuita de
              <strong>14 dias</strong>.
            </p>
            <p style="color:#374151;line-height:1.6">
              Ya puedes configurar tu colegio, agregar alumnos, grados y empezar a usar los cobros automaticos.
            </p>
            <a href="${APP_URL}/app" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Ir a mi panel
            </a>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">
              AulaPro - Gestion escolar inteligente para colegios en Guatemala.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Bienvenida enviada a ${to}`);
  } catch (err) {
    console.error('[Email] sendWelcomeEmail failed:', err);
  }
}

export async function sendNotificationEmail(to: string, titulo: string, mensaje: string) {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurada, se omite envio a', to);
    return;
  }
  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject: titulo,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#059669;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">${titulo}</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
            <p style="color:#374151;line-height:1.6;white-space:pre-wrap">${mensaje}</p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">AulaPro - Gestion escolar inteligente.</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Notificacion enviada a ${to}`);
  } catch (err) {
    console.error('[Email] sendNotificationEmail failed:', err);
  }
}

export async function sendAbsenceEmail(
  to: string,
  alumnoNombre: string,
  fecha: string,
  colegioNombre: string,
  gradoNombre?: string,
  materiaNombre?: string,
) {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurada, se omite aviso de ausencia a', to);
    return;
  }
  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject: `Aviso de ausencia - ${alumnoNombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#dc2626;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">Aviso de Ausencia</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
            <p style="color:#374151;line-height:1.6">
              Le informamos que el alumno <strong>${alumnoNombre}</strong> fue registrado como
              <strong>ausente</strong> el dia <strong>${fecha}</strong>.
            </p>
            ${gradoNombre ? `<p style="color:#374151;line-height:1.6">Grado: <strong>${gradoNombre}</strong></p>` : ''}
            ${materiaNombre ? `<p style="color:#374151;line-height:1.6">Materia: <strong>${materiaNombre}</strong></p>` : ''}
            <p style="color:#374151;line-height:1.6">
              Si la ausencia fue justificada, por favor comuniquelo al colegio.
            </p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">${colegioNombre} - AulaPro</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Aviso de ausencia enviado a ${to}`);
  } catch (err) {
    console.error('[Email] sendAbsenceEmail failed:', err);
  }
}

export async function sendPaymentConfirmationEmail(to: string, alumnoNombre: string, mes: string, monto: number, colegioNombre: string) {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurada, se omite envio a', to);
    return;
  }
  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject: `Pago recibido - ${mes} - ${colegioNombre}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#059669;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">Pago confirmado</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
            <p style="color:#374151">Hola,</p>
            <p style="color:#374151;line-height:1.6">
              Hemos recibido el pago de <strong>${alumnoNombre}</strong> correspondiente al mes de
              <strong>${mes}</strong> por <strong>Q${monto.toFixed(2)}</strong> en <strong>${colegioNombre}</strong>.
            </p>
            <p style="color:#6b7280;font-size:13px">Gracias por tu pago. AulaPro</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Confirmacion de pago enviada a ${to}`);
  } catch (err) {
    console.error('[Email] sendPaymentConfirmationEmail failed:', err);
  }
}

export async function sendAttendanceReportEmail(
  to: string,
  data: {
    colegio: string;
    fecha: string;
    responsable: string;
    hijos: { alumno: string; grado: string }[];
  },
) {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY no configurada, se omite reporte de asistencia a', to);
    return;
  }
  const filas = data.hijos
    .map(
      (h) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${h.alumno}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${h.grado}</td></tr>`,
    )
    .join('');
  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject: `Aviso de inasistencia - ${data.colegio}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#dc2626;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">Aviso de Inasistencia</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 12px 12px">
            <p style="color:#374151;line-height:1.6">Hola ${data.responsable || ''},</p>
            <p style="color:#374151;line-height:1.6">
              Registramos que el dia <strong>${data.fecha}</strong> el(los) siguiente(s) alumno(s)
              no asistieron a clases en <strong>${data.colegio}</strong>:
            </p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead><tr style="background:#f9fafb;text-align:left">
                <th style="padding:8px 12px;color:#6b7280">Alumno</th>
                <th style="padding:8px 12px;color:#6b7280">Grado</th>
              </tr></thead>
              <tbody>${filas}</tbody>
            </table>
            <p style="color:#374151;line-height:1.6">
              Si la ausencia fue justificada, por favor comunicate con el colegio. Las inasistencias
              injustificadas se toman en cuenta en la evaluacion de cada bimestre.
            </p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px">${data.colegio} - AulaPro</p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Reporte de asistencia enviado a ${to}`);
  } catch (err) {
    console.error('[Email] sendAttendanceReportEmail failed:', err);
  }
}
