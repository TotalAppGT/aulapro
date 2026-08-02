import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { sendMessage } from '../../services/whatsapp.service';
import { sendPaymentConfirmationEmail } from '../../services/email.service';

export const webhookRoutes = Router();

webhookRoutes.post('/recurrente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-recurrente-signature'] as string;
    console.log('[Recurrente Webhook] Signature:', signature ? 'present' : 'missing');

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
          const message = `✅ Pago recibido - ${colegio.nombre}\n\nAlumno: ${nombreCompleto}\nMes: ${mes}\nEstado: Pagado\n\nGracias por tu pago.`;
          sendMessage(colegio.usuarios[0].telefono, message).catch((err: Error) => {
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
