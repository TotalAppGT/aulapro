import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { colegioRoutes } from './colegio.routes';
import { alumnoRoutes } from './alumno.routes';
import { gradoRoutes } from './grado.routes';
import { pagoRoutes } from './pago.routes';
import { calificacionRoutes } from './calificacion.routes';
import { tareaRoutes } from './tarea.routes';
import { asistenciaRoutes } from './asistencia.routes';
import { anuncioRoutes } from './anuncio.routes';
import { materiaRoutes } from './materia.routes';
import { dashboardRoutes } from './dashboard.routes';
import { reporteRoutes } from './reporte.routes';
import { qrRoutes } from './qr.routes';
import { notificacionRoutes } from './notificacion.routes';
import { usuarioRoutes } from './usuario.routes';
import { mensajeRoutes } from './mensaje.routes';
import { cursoRoutes } from './curso.routes';
import { uploadRoutes } from './upload.routes';
import { webhookRoutes } from './webhooks/recurrente';
import { whatsappWebhookRoutes } from './webhooks/whatsapp';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use(colegioRoutes);
router.use('/:colegioId/alumnos', alumnoRoutes);
router.use('/:colegioId/grados', gradoRoutes);
router.use('/:colegioId/pagos', pagoRoutes);
router.use('/:colegioId/calificaciones', calificacionRoutes);
router.use('/:colegioId/tareas', tareaRoutes);
router.use('/:colegioId/asistencias', asistenciaRoutes);
router.use('/:colegioId/anuncios', anuncioRoutes);
router.use('/:colegioId/materias', materiaRoutes);
router.use('/:colegioId/dashboard', dashboardRoutes);
router.use('/:colegioId/reportes', reporteRoutes);
router.use('/:colegioId/notificaciones', notificacionRoutes);
router.use('/:colegioId/usuarios', usuarioRoutes);
router.use('/:colegioId/mensajes', mensajeRoutes);
router.use('/:colegioId/cursos', cursoRoutes);
router.use('/:colegioId/uploads', uploadRoutes);
router.use(qrRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/webhooks/whatsapp', whatsappWebhookRoutes);
