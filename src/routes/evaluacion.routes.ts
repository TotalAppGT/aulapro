import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const evaluacionRoutes = Router();

evaluacionRoutes.use(authMiddleware);
evaluacionRoutes.use(tenantMiddleware);

const preguntaSchema = z.object({
  enunciado: z.string().min(1).max(1000),
  tipo: z.enum(['OPCION_MULTIPLE', 'VERDADERO_FALSO', 'RESPUESTA_CORTA']).default('OPCION_MULTIPLE'),
  opciones: z.array(z.string()).default([]),
  respuestaCorrecta: z.string().min(1).max(500),
  puntaje: z.number().min(0.1).max(100).default(1),
});

const evaluacionSchema = z.object({
  cursoId: z.string().min(1),
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  tipo: z.enum(['QUIZ', 'EXAMEN', 'PRACTICA']).default('QUIZ'),
  intentosMax: z.number().int().min(1).max(10).default(1),
  publicado: z.boolean().default(true),
  preguntas: z.array(preguntaSchema).min(1),
});

function normalizar(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

evaluacionRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const rol = req.user!.rol;
    const cursoId = typeof req.query.cursoId === 'string' ? req.query.cursoId : '';
    if (!cursoId) {
      res.status(400).json({ error: 'cursoId requerido' });
      return;
    }

    const where: Record<string, unknown> = { colegioId, cursoId };
    if (rol === 'ALUMNO' || rol === 'PADRE') where.publicado = true;

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      include: { _count: { select: { preguntas: true, intentos: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (rol === 'ALUMNO' || rol === 'PADRE') {
      const intentos = await prisma.intentoEvaluacion.findMany({
        where: { colegioId, usuarioId: req.user!.userId },
        orderBy: { iniciadoAt: 'desc' },
      });
      const result = evaluaciones.map((e) => {
        const mios = intentos.filter((i) => i.evaluacionId === e.id);
        return { ...e, misIntentos: mios.length, miMejorNota: mios.reduce<number | null>((acc, i) => (i.nota != null && (acc == null || i.nota > acc) ? i.nota : acc), null) };
      });
      res.json(result);
      return;
    }

    res.json(evaluaciones);
  } catch (err) {
    next(err);
  }
});

evaluacionRoutes.post(
  '/',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = evaluacionSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const curso = await prisma.curso.findFirst({ where: { id: body.cursoId, colegioId } });
      if (!curso) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }

      const puntajeTotal = body.preguntas.reduce((s, p) => s + p.puntaje, 0);

      const evaluacion = await prisma.evaluacion.create({
        data: {
          colegioId,
          cursoId: body.cursoId,
          titulo: body.titulo,
          descripcion: body.descripcion || null,
          tipo: body.tipo,
          puntajeTotal,
          intentosMax: body.intentosMax,
          publicado: body.publicado,
          creadoPor: req.user!.userId,
          preguntas: {
            create: body.preguntas.map((p, i) => ({
              orden: i,
              enunciado: p.enunciado,
              tipo: p.tipo,
              opciones: p.opciones,
              respuestaCorrecta: p.respuestaCorrecta,
              puntaje: p.puntaje,
            })),
          },
        },
        include: { preguntas: true },
      });

      res.status(201).json(evaluacion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

evaluacionRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const rol = req.user!.rol;
    const evaluacion = await prisma.evaluacion.findFirst({
      where: { id: req.params.id, colegioId },
      include: { preguntas: { orderBy: { orden: 'asc' } } },
    });
    if (!evaluacion) {
      res.status(404).json({ error: 'Evaluación no encontrada' });
      return;
    }

    const esDocente = rol === 'PROFESOR' || rol === 'ADMIN_COLEGIO';
    if (!esDocente) {
      const misIntentos = await prisma.intentoEvaluacion.findMany({
        where: { colegioId, evaluacionId: evaluacion.id, usuarioId: req.user!.userId },
        orderBy: { iniciadoAt: 'desc' },
      });
      const preguntas = evaluacion.preguntas.map((p) => ({
        id: p.id,
        orden: p.orden,
        enunciado: p.enunciado,
        tipo: p.tipo,
        opciones: p.opciones,
        puntaje: p.puntaje,
      }));
      res.json({ ...evaluacion, preguntas, intentos: undefined, misIntentos });
      return;
    }

    res.json(evaluacion);
  } catch (err) {
    next(err);
  }
});

evaluacionRoutes.post('/:id/intentos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const evaluacion = await prisma.evaluacion.findFirst({
      where: { id: req.params.id, colegioId },
    });
    if (!evaluacion) {
      res.status(404).json({ error: 'Evaluación no encontrada' });
      return;
    }

    const previos = await prisma.intentoEvaluacion.count({
      where: { colegioId, evaluacionId: evaluacion.id, usuarioId: req.user!.userId },
    });
    if (previos >= evaluacion.intentosMax) {
      res.status(400).json({ error: 'Ya alcanzaste el número máximo de intentos' });
      return;
    }

    const intento = await prisma.intentoEvaluacion.create({
      data: { colegioId, evaluacionId: evaluacion.id, usuarioId: req.user!.userId, estado: 'EN_PROGRESO' },
    });
    res.status(201).json(intento);
  } catch (err) {
    next(err);
  }
});

const responderSchema = z.object({
  respuestas: z.record(z.string()),
});

evaluacionRoutes.post('/intentos/:intentoId/responder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = responderSchema.parse(req.body);
    const colegioId = req.user!.colegioId;

    const intento = await prisma.intentoEvaluacion.findFirst({
      where: { id: req.params.intentoId, colegioId, usuarioId: req.user!.userId },
      include: { evaluacion: { include: { preguntas: true } } },
    });
    if (!intento) {
      res.status(404).json({ error: 'Intento no encontrado' });
      return;
    }
    if (intento.estado !== 'EN_PROGRESO') {
      res.status(400).json({ error: 'Este intento ya fue enviado' });
      return;
    }

    let obtenido = 0;
    let total = 0;
    const detalle: Array<{ preguntaId: string; correcta: boolean; respuestaCorrecta: string }> = [];

    for (const p of intento.evaluacion.preguntas) {
      total += p.puntaje;
      const respuesta = body.respuestas[p.id];
      const esCorrecta = normalizar(respuesta) === normalizar(p.respuestaCorrecta);
      if (esCorrecta) obtenido += p.puntaje;
      detalle.push({ preguntaId: p.id, correcta: esCorrecta, respuestaCorrecta: p.respuestaCorrecta });
    }

    const nota = total > 0 ? Math.round((obtenido / total) * intento.evaluacion.puntajeTotal * 100) / 100 : 0;

    const actualizado = await prisma.intentoEvaluacion.update({
      where: { id: intento.id },
      data: {
        respuestas: body.respuestas,
        nota,
        estado: 'CALIFICADO',
        finalizadoAt: new Date(),
      },
    });

    res.json({ intento: actualizado, nota, obtenido, total, detalle });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});

evaluacionRoutes.get(
  '/:id/resultados',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const intentos = await prisma.intentoEvaluacion.findMany({
        where: { colegioId, evaluacionId: req.params.id, estado: 'CALIFICADO' },
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
        orderBy: { nota: 'desc' },
      });
      res.json(intentos);
    } catch (err) {
      next(err);
    }
  }
);

evaluacionRoutes.delete(
  '/:id',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const evaluacion = await prisma.evaluacion.findFirst({
        where: { id: req.params.id, colegioId },
      });
      if (!evaluacion) {
        res.status(404).json({ error: 'Evaluación no encontrada' });
        return;
      }
      await prisma.evaluacion.delete({ where: { id: evaluacion.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);
