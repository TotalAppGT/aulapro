import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { generateBoletinPDF } from '../services/pdf.service';

export const calificacionRoutes = Router();

calificacionRoutes.use(authMiddleware);
calificacionRoutes.use(tenantMiddleware);

const calificacionSchema = z.object({
  alumnoId: z.string().min(1),
  materiaId: z.string().min(1),
  bimestre: z.number().int().min(1).max(4),
  nota: z.number().min(0).max(100),
  tipo: z.string().min(1).max(50).default('parcial'),
});

calificacionRoutes.post(
  '/',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = calificacionSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const alumno = await prisma.alumno.findFirst({
        where: { id: body.alumnoId, colegioId, activo: true },
      });
      if (!alumno) {
        res.status(404).json({ error: 'Alumno no encontrado' });
        return;
      }

      const materia = await prisma.materia.findFirst({
        where: { id: body.materiaId, colegioId },
      });
      if (!materia) {
        res.status(404).json({ error: 'Materia no encontrada' });
        return;
      }

      const calificacion = await prisma.calificacion.create({
        data: {
          colegioId,
          alumnoId: body.alumnoId,
          materiaId: body.materiaId,
          bimestre: body.bimestre,
          nota: body.nota,
          tipo: body.tipo,
          registradoPor: req.user!.userId,
        },
      });

      res.status(201).json(calificacion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

calificacionRoutes.get(
  '/alumno/:alumnoId/:bimestre',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alumnoId, bimestre } = req.params;
      const colegioId = req.user!.colegioId;

      const calificaciones = await prisma.calificacion.findMany({
        where: { colegioId, alumnoId, bimestre: Number(bimestre) },
        include: { materia: { select: { id: true, nombre: true } } },
        orderBy: { materia: { nombre: 'asc' } },
      });

      const materiasMap = new Map<string, { materia: { id: string; nombre: string }; notas: { tipo: string; nota: number }[] }>();
      for (const cal of calificaciones) {
        if (!materiasMap.has(cal.materiaId)) {
          materiasMap.set(cal.materiaId, { materia: cal.materia, notas: [] });
        }
        materiasMap.get(cal.materiaId)!.notas.push({
          tipo: cal.tipo,
          nota: cal.nota,
        });
      }

      const materias = Array.from(materiasMap.values()).map((m) => {
        const promedio =
          m.notas.reduce((s: number, n: { nota: number }) => s + n.nota, 0) / m.notas.length;
        return {
          materia: m.materia,
          notas: m.notas,
          promedio: Math.round(promedio * 100) / 100,
        };
      });

      res.json({ alumnoId, bimestre: Number(bimestre), materias });
    } catch (err) {
      next(err);
    }
  }
);

calificacionRoutes.get(
  '/grado/:gradoId/:materiaId/:bimestre',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gradoId, materiaId, bimestre } = req.params;
      const colegioId = req.user!.colegioId;

      const alumnos = await prisma.alumno.findMany({
        where: { colegioId, gradoId, activo: true },
        select: { id: true, nombre: true, apellido: true },
        orderBy: { nombre: 'asc' },
      });

      const alumnoIds = alumnos.map((a: { id: string }) => a.id);

      const calificaciones = await prisma.calificacion.findMany({
        where: {
          colegioId,
          alumnoId: { in: alumnoIds },
          materiaId,
          bimestre: Number(bimestre),
        },
      });

      const result = alumnos.map((alumno: { id: string; nombre: string; apellido: string | null }) => {
        const notas = calificaciones
          .filter((c: { alumnoId: string; tipo: string; nota: number }) => c.alumnoId === alumno.id)
          .map((c: { tipo: string; nota: number }) => ({ tipo: c.tipo, nota: c.nota }));
        const promedio = notas.length > 0
          ? Math.round((notas.reduce((s: number, n: { nota: number }) => s + n.nota, 0) / notas.length) * 100) / 100
          : null;
        return {
          alumno: { id: alumno.id, nombre: alumno.nombre, apellido: alumno.apellido },
          notas,
          promedio,
        };
      });

      res.json({ gradoId, materiaId, bimestre: Number(bimestre), alumnos: result });
    } catch (err) {
      next(err);
    }
  }
);

calificacionRoutes.get(
  '/boletin/:alumnoId/:bimestre',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alumnoId, bimestre } = req.params;
      const colegioId = req.user!.colegioId;

      const url = await generateBoletinPDF(alumnoId, colegioId, Number(bimestre));

      res.json({ url });
    } catch (err) {
      next(err);
    }
  }
);
