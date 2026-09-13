import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { WHATSAPP_WEBHOOK_VERIFY_TOKEN } from '../../config';
import { sendMessage } from '../../services/whatsapp.service';

export const whatsappWebhookRoutes = Router();

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').replace(/^502/, '');
}

whatsappWebhookRoutes.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const verifyToken = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && verifyToken === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified OK');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ error: 'Verification failed' });
});

whatsappWebhookRoutes.post('/', (req: Request, res: Response, _next: NextFunction) => {
  const body = req.body;

  res.status(200).json({ received: true });

  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0]?.value;

  if (!changes) return;

  const message = changes.messages?.[0];
  if (!message) return;

  const from = message.from as string;
  const senderPhone = normalizePhone(from);

  console.log(`[WhatsApp Webhook] Mensaje de ${from}:`, message.text?.body ?? message.type);

  handleInbound(senderPhone, from, message).catch((err) => {
    console.error('[WhatsApp Webhook] Error procesando mensaje:', err);
  });
});

async function handleInbound(
  senderPhone: string,
  originalFrom: string,
  message: { type: string; text?: { body?: string }; document?: unknown }
) {
  const texto = message.text?.body?.trim();
  if (!texto) return;

  const lower = texto.toLowerCase();

  const usuarios = await prisma.usuario.findMany({
    where: { activo: true, telefono: { not: null } },
    select: { id: true, telefono: true, colegioId: true, rol: true },
  });

  const remitente = usuarios.find((u) => normalizePhone(u.telefono!) === senderPhone);

  if (remitente) {
    const admins = await prisma.usuario.findMany({
      where: { colegioId: remitente.colegioId, rol: 'ADMIN_COLEGIO', activo: true },
      select: { id: true },
      take: 1,
    });

    if (admins.length > 0) {
      await prisma.mensaje.create({
        data: {
          colegioId: remitente.colegioId,
          remitenteId: remitente.id,
          destinatarioId: admins[0].id,
          contenido: texto,
        },
      });
      console.log(`[WhatsApp Webhook] Mensaje guardado de ${remitente.id}`);
      return;
    }
  }

  if (lower.startsWith('hola') || lower.startsWith('buenas')) {
    await sendMessage(originalFrom, '¡Hola! Gracias por escribir a AulaPro. Te atenderemos en breve.');
    return;
  }

  if (lower.includes('codigo') || lower.includes('carnet')) {
    const alumnos = await prisma.alumno.findMany({
      where: { activo: true, codigo: { contains: lower.replace(/[^0-9]/g, '') } },
    });
    if (alumnos.length > 0) {
      await sendMessage(
        originalFrom,
        `Código encontrado: ${alumnos[0].codigo} - ${alumnos[0].nombre} ${alumnos[0].apellido || ''}`
      );
    } else {
      await sendMessage(originalFrom, 'No encontramos ese código. Verifica que sea correcto.');
    }
    return;
  }

  if (lower.includes('pagar') || lower.includes('pago')) {
    await sendMessage(
      originalFrom,
      'Para realizar un pago, inicia sesión en el portal de padres de tu colegio y revisa la sección de Pagos.'
    );
    return;
  }
}
