import { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID } from '../config';

const WHATSAPP_API_VERSION = 'v19.0';

export async function sendMessage(to: string, message: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp sendMessage failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function sendDocument(
  to: string,
  documentUrl: string,
  caption: string,
  filename: string,
) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'document',
    document: {
      link: documentUrl,
      caption,
      filename,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp sendDocument failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function sendPaymentReminder(
  to: string,
  alumnoNombre: string,
  mes: string,
  monto: number,
  paymentUrl: string,
) {
  const message = [
    `*Recordatorio de Pago - AulaPro*`,
    ``,
    `Estimado padre/madre de *${alumnoNombre}*:`,
    ``,
    `Le recordamos que la colegiatura correspondiente al mes de *${mes}* por un monto de *Q${monto.toFixed(2)}* esta pendiente de pago.`,
    ``,
    `Puede realizar el pago a traves del siguiente enlace:`,
    `${paymentUrl}`,
    ``,
    `Gracias por su atencion.`,
  ].join('\n');

  return sendMessage(to, message);
}
