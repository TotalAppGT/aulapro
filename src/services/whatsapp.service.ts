import { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID } from '../config';

const WHATSAPP_API_VERSION = 'v22.0';

export const SISTEMA_NOMBRE = 'AulaPro';
const TEMPLATE_NOMBRE = 'totalappgt_aviso';
const TEMPLATE_LANG = 'es_MX';

async function postWhatsApp(payload: Record<string, unknown>) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, raw: data, error: response.ok ? undefined : JSON.stringify(data) };
}

export async function sendMessage(to: string, message: string) {
  const result = await postWhatsApp({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  });

  if (!result.ok) {
    throw new Error(`WhatsApp sendMessage failed: ${result.error}`);
  }

  return result.raw;
}

export async function sendDocument(
  to: string,
  documentUrl: string,
  caption: string,
  filename: string,
) {
  const result = await postWhatsApp({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'document',
    document: {
      link: documentUrl,
      caption,
      filename,
    },
  });

  if (!result.ok) {
    throw new Error(`WhatsApp sendDocument failed: ${result.error}`);
  }

  return result.raw;
}

export async function enviarPlantillaAlerta(telefono: string, sistema: string, mensaje: string) {
  const result = await postWhatsApp({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telefono.replace(/\D/g, ''),
    type: 'template',
    template: {
      name: TEMPLATE_NOMBRE,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', parameter_name: 'sistema', text: sistema },
            { type: 'text', parameter_name: 'mensaje', text: mensaje },
          ],
        },
      ],
    },
  });

  if (!result.ok) {
    throw new Error(`WhatsApp enviarPlantillaAlerta failed: ${result.error}`);
  }

  return result.raw;
}

export async function sendTemplateMessage(to: string, titulo: string, mensaje: string) {
  const cuerpo = `📢 ${titulo}\n\n${mensaje}`;
  return enviarPlantillaAlerta(to, SISTEMA_NOMBRE, cuerpo);
}

export async function sendPaymentReminder(
  to: string,
  alumnoNombre: string,
  mes: string,
  monto: number,
  paymentUrl: string,
) {
  const mensaje = [
    `Le recordamos que la colegiatura del mes de ${mes} por un monto de Q${monto.toFixed(2)} esta pendiente de pago.`,
    `Puede realizar el pago a traves del siguiente enlace: ${paymentUrl}`,
  ].join('\n');

  return enviarPlantillaAlerta(to, SISTEMA_NOMBRE, mensaje);
}
