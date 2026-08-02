import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateReference } from '../lib/utils';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { createCheckout } from '../services/recurrente.service';

export const pagoRoutes = Router();

pagoRoutes.use(authMiddleware);
pagoRoutes.use(tenantMiddleware);

const checkoutSchema = z.object({
  alumnoId: z.string().min(1),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
});

pagoRoutes.post(
  '/generar-mes',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const { mes } = req.body;

      if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
        res.status(400).json({ error: 'Mes inválido. Formato: YYYY-MM' });
        return;
      }

      const alumnos = await prisma.alumno.findMany({
        where: { colegioId, activo: true },
      });

      if (alumnos.length === 0) {
        res.status(400).json({ error: 'No hay alumnos activos en este colegio' });
        return;
      }

      const montoBase = 350;

      const created: any[] = [];
      const skipped: any[] = [];

      for (const alumno of alumnos) {
        const existing = await prisma.mensualidad.findFirst({
          where: { colegioId, alumnoId: alumno.id, mes },
        });

        if (existing) {
          skipped.push(alumno.id);
          continue;
        }

        const mensualidad = await prisma.mensualidad.create({
          data: {
            colegioId,
            alumnoId: alumno.id,
            mes,
            monto: montoBase,
            estado: 'PENDIENTE',
          },
        });

        created.push(mensualidad);
      }

      res.status(201).json({
        message: `Generadas ${created.length} mensualidades, ${skipped.length} ya existían`,
        created,
        skipped,
        mes,
        monto: montoBase,
      });
    } catch (err) {
      next(err);
    }
  }
);

pagoRoutes.post(
  '/checkout',
  requireRole('PADRE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = checkoutSchema.parse(req.body);
      const colegioId = req.user!.colegioId;
      const { alumnoId, mes } = body;

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, colegioId, activo: true },
      });

      if (!alumno) {
        res.status(404).json({ error: 'Alumno no encontrado' });
        return;
      }

      const colegio = await prisma.colegio.findUnique({ where: { id: colegioId } });
      if (!colegio) {
        res.status(404).json({ error: 'Colegio no encontrado' });
        return;
      }

      const mensualidad = await prisma.mensualidad.findFirst({
        where: { colegioId, alumnoId, mes },
      });

      if (mensualidad && mensualidad.estado === 'PAGADO') {
        res.status(400).json({ error: 'Este mes ya fue pagado' });
        return;
      }

      const monto = mensualidad?.monto || 350;

      const checkoutResult = await createCheckout({
        colegioId,
        alumnoId,
        mes,
        monto,
        nombreAlumno: `${alumno.nombre} ${alumno.apellido || ''}`,
        nombreColegio: colegio.nombre,
      });

      const referencia = generateReference(colegioId, alumnoId, mes);

      await prisma.pagoCheckout.create({
        data: {
          colegioId,
          checkoutId: checkoutResult.checkoutId,
          metadata: {
            colegioId,
            alumnoId,
            mes,
            referencia,
          },
          monto,
          estado: 'pendiente',
          recurrenteData: checkoutResult as unknown as Prisma.InputJsonValue,
        },
      });

      res.json({
        checkout_url: checkoutResult.checkoutUrl,
        checkout_id: checkoutResult.checkoutId,
        referencia,
        monto,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

pagoRoutes.get(
  '/estado/:alumnoId/:mes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { alumnoId, mes } = req.params;
      const colegioId = req.user!.colegioId;

      const mensualidad = await prisma.mensualidad.findFirst({
        where: { colegioId, alumnoId, mes },
        include: { alumno: true },
      });

      if (!mensualidad) {
        res.status(404).json({ error: 'No se encontró mensualidad para este mes' });
        return;
      }

      res.json({
        id: mensualidad.id,
        alumno: mensualidad.alumno.nombre,
        mes: mensualidad.mes,
        monto: mensualidad.monto,
        estado: mensualidad.estado,
        fechaPago: mensualidad.fechaPago,
        liquidado: mensualidad.liquidado,
      });
    } catch (err) {
      next(err);
    }
  }
);

pagoRoutes.get(
  '/reporte/:mes',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mes } = req.params;
      const colegioId = req.user!.colegioId;

      const mensualidades = await prisma.mensualidad.findMany({
        where: { colegioId, mes },
        include: { alumno: { select: { id: true, nombre: true, apellido: true, grado: { select: { nombre: true } } } } },
        orderBy: { alumno: { nombre: 'asc' } },
      });

      const pagadas = mensualidades.filter((m: { estado: string }) => m.estado === 'PAGADO').length;
      const pendientes = mensualidades.filter((m: { estado: string }) => m.estado === 'PENDIENTE').length;
      const vencidas = mensualidades.filter((m: { estado: string }) => m.estado === 'VENCIDO').length;
      const totalRecaudado = mensualidades
        .filter((m: { estado: string }) => m.estado === 'PAGADO')
        .reduce((sum: number, m: { monto: number }) => sum + m.monto, 0);

      res.json({
        mes,
        resumen: {
          total: mensualidades.length,
          pagadas,
          pendientes,
          vencidas,
          totalRecaudado,
        },
        detalle: mensualidades.map((m: { alumnoId: string; alumno: { nombre: string; apellido: string | null; grado: { nombre: string } | null }; monto: number; estado: string; fechaPago: Date | null }) => ({
          alumnoId: m.alumnoId,
          alumno: `${m.alumno.nombre} ${m.alumno.apellido || ''}`,
          grado: m.alumno.grado?.nombre || '-',
          monto: m.monto,
          estado: m.estado,
          fechaPago: m.fechaPago,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

pagoRoutes.get(
  '/comisiones',
  requireRole('ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const pagosMes = await prisma.mensualidad.findMany({
        where: {
          colegioId,
          estado: 'PAGADO',
          fechaPago: { gte: startOfMonth },
        },
      });

      const totalRecaudado = pagosMes.reduce((sum: number, p: { monto: number }) => sum + p.monto, 0);
      const comisionPlataforma = pagosMes.reduce((sum: number, p: { comisionPlataforma: number | null }) => sum + (p.comisionPlataforma || 0), 0);
      const netoColegio = totalRecaudado - comisionPlataforma;

      res.json({
        periodo: {
          desde: startOfMonth.toISOString(),
          hasta: now.toISOString(),
        },
        totalRecaudado,
        comisionPlataforma,
        netoColegio,
        totalPagos: pagosMes.length,
      });
    } catch (err) {
      next(err);
    }
  }
);
