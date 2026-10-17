import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { sendTemplateMessage } from '../../services/whatsapp.service';
import { sendPaymentConfirmationEmail } from '../../services/email.service';
import { RECURRENTE_WEBHOOK_SECRET } from '../../config';

export const webhookRoutes = Router();

function verificarFirmaSvix(req: Request): { ok: boolean; motivo: string } {
  if (!RECURRENTE_WEBHOOK_SECRET) {
    return { ok: true, motivo: 'sin secreto configurado (verificacion omitida)' };
  }

  const id = req.headers['svix-id'] as string | undefined;
  const timestamp = req.headers['svix-timestamp'] as string | undefined;
  const signature = req.headers['svix-signature'] as string | undefined;
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

  if (!id || !timestamp || !signature || !rawBody) {
    return { ok: false, motivo: 'faltan headers svix o raw body' };
  }

  const ahora = Math.floor(Date.now() / 1000);
  if (Math.abs(ahora - Number(timestamp)) > 300) {
    return { ok: false, motivo: 'timestamp fuera de tolerancia' };
  }

  const secret = Buffer.from(RECURRENTE_WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
  const firmado = `${id}.${timestamp}.${rawBody.toString('utf8')}`;
  const esperado = crypto.createHmac('sha256', secret).update(firmado).digest('base64');

  const candidatos = signature
    .split(' ')
    .map((parte) => parte.split(',')[1])
    .filter(Boolean);

  const ok = candidatos.some((c) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(c), Buffer.from(esperado));
    } catch {
      return false;
    }
  });

  return { ok, motivo: ok ? 'ok' : 'firma invalida' };
}

webhookRoutes.post('/recurrente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const firma = verificarFirmaSvix(req);
    if (!firma.ok) {
      console.warn('[Recurrente Webhook] Rechazado:', firma.motivo);
      res.status(401).json({ error: 'Firma de webhook invalida' });
      return;
    }

    const event = req.body as {
      event_type: string;
      data: {
        checkout: {
          id: string;
          metadata?: Record<string, string>;
        };
        error?: {
          code: string;
          message: string;
        };
      };
    };

    const eventType = event.event_type;
    const checkoutData = event.data?.checkout;

    if (!checkoutData?.metadata) {
      res.status(400).json({ error: 'Metadata no encontrada' });
      return;
    }

    const colegioId = checkoutData.metadata.colegioId;
    const alumnoId = checkoutData.metadata.alumnoId;
    const mes = checkoutData.metadata.mes;

    if (!colegioId || !alumnoId || !mes) {
      res.status(400).json({ error: 'Metadata incompleta' });
      return;
    }

    if (eventType === 'intent.succeeded') {
      const [mensualidad, pagoCheckout] = await Promise.all([
        prisma.mensualidad.findFirst({
          where: { colegioId, alumnoId, mes },
        }),
        prisma.pagoCheckout.findFirst({
          where: { checkoutId: checkoutData.id },
        }),
      ]);

      const updates: Promise<any>[] = [];

      if (mensualidad) {
        updates.push(
          prisma.mensualidad.update({
            where: { id: mensualidad.id },
            data: {
              estado: 'PAGADO',
              fechaPago: new Date(),
              recurrenteCheckoutId: checkoutData.id,
            },
          })
        );
      }

      if (pagoCheckout) {
        updates.push(
          prisma.pagoCheckout.update({
            where: { id: pagoCheckout.id },
            data: {
              estado: 'completado',
              recurrenteData: event as unknown as Prisma.InputJsonValue,
            },
          })
        );
      }

      await Promise.all(updates);

      const colegio = await prisma.colegio.findUnique({
        where: { id: colegioId },
        include: {
          usuarios: {
            where: { rol: 'ADMIN_COLEGIO', activo: true },
            take: 1,
          },
        },
      });

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId },
        select: { nombre: true, apellido: true },
      });

      if (colegio && alumno) {
        const nombreCompleto = `${alumno.nombre} ${alumno.apellido || ''}`.trim();

        if (colegio.usuarios[0]?.telefono) {
          const mensaje = `Pago recibido - ${colegio.nombre}. Mes: ${mes}. Estado: Pagado. Gracias por tu pago.`;
          sendTemplateMessage(colegio.usuarios[0].telefono, nombreCompleto, mensaje).catch((err: Error) => {
            console.error('[WhatsApp] Notification failed:', err);
          });
        }

        if (colegio.emailAdmin) {
          const mensualidad = await prisma.mensualidad.findFirst({
            where: { colegioId, alumnoId, mes },
          });
          if (mensualidad) {
            sendPaymentConfirmationEmail(
              colegio.emailAdmin,
              nombreCompleto,
              mes,
              mensualidad.monto,
              colegio.nombre,
            );
          }
        }
      }

      res.json({ received: true, status: 'processed' });
      return;
    }

    if (eventType === 'intent.failed') {
      const mensualidad = await prisma.mensualidad.findFirst({
        where: { colegioId, alumnoId, mes },
      });

      if (mensualidad) {
        await prisma.mensualidad.update({
          where: { id: mensualidad.id },
          data: { estado: 'VENCIDO' },
        });

        const pagoCheckout = await prisma.pagoCheckout.findFirst({
          where: { checkoutId: checkoutData.id },
        });

        if (pagoCheckout) {
          await prisma.pagoCheckout.update({
            where: { id: pagoCheckout.id },
            data: { estado: 'fallido' },
          });
        }
      }

      res.json({ received: true, status: 'processed' });
      return;
    }

    res.json({ received: true, status: 'ignored', event: eventType });
  } catch (err) {
    next(err);
  }
});
