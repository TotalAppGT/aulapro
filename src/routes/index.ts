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
import { webhookRoutes } from './webhooks/recurrente';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use(authRoutes);
router.use(colegioRoutes);
router.use('/:colegioId/alumnos', alumnoRoutes);
router.use('/:colegioId/grados', gradoRoutes);
router.use('/:colegioId/pagos', pagoRoutes);
router.use('/:colegioId/calificaciones', calificacionRoutes);
router.use('/:colegioId/tareas', tareaRoutes);
router.use('/:colegioId/asistencias', asistenciaRoutes);
router.use('/:colegioId/anuncios', anuncioRoutes);
router.use('/webhooks', webhookRoutes);
