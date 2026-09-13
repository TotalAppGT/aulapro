import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { generateQrToken, qrPng, qrDataUrl } from '../services/qr.service';

export const qrRoutes = Router();

qrRoutes.get('/qr/:qrToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken } = req.params;

    const alumno = await prisma.alumno.findUnique({
      where: { qrToken },
      include: {
        grado: { select: { nombre: true } },
        colegio: { select: { id: true, nombre: true, logoUrl: true } },
      },
    });

    if (!alumno) {
      res.status(404).json({ error: 'Código QR inválido o alumno no encontrado' });
      return;
    }

    res.json({
      verificado: true,
      alumnoId: alumno.id,
      codigo: alumno.codigo,
      nombre: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
      grado: alumno.grado?.nombre || '-',
      colegio: alumno.colegio.nombre,
    });
  } catch (err) {
    next(err);
  }
});

qrRoutes.get('/qr/:qrToken.png', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken } = req.params;

    const alumno = await prisma.alumno.findUnique({ where: { qrToken } });
    if (!alumno) {
      res.status(404).json({ error: 'Código QR inválido' });
      return;
    }

    const buffer = await qrPng(qrToken);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

qrRoutes.post(
  '/qr/verificar',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrToken, registrarAsistencia } = req.body as {
        qrToken?: string;
        registrarAsistencia?: boolean;
      };

      if (!qrToken) {
        res.status(400).json({ error: 'qrToken requerido' });
        return;
      }

      const alumno = await prisma.alumno.findUnique({
        where: { qrToken },
        include: {
          grado: { select: { nombre: true } },
          colegio: { select: { id: true, nombre: true } },
        },
      });

      if (!alumno || !alumno.activo) {
        res.status(404).json({ error: 'Alumno no válido' });
        return;
      }

      let asistenciaRegistrada = false;
      let estadoAsistencia = '';

      if (registrarAsistencia) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyFin = new Date(hoy);
        hoyFin.setDate(hoyFin.getDate() + 1);

        const existing = await prisma.asistencia.findFirst({
          where: { colegioId: alumno.colegioId, alumnoId: alumno.id, fecha: hoy },
        });

        if (!existing) {
          const admin = await prisma.usuario.findFirst({
            where: { colegioId: alumno.colegioId, rol: 'ADMIN_COLEGIO', activo: true },
            select: { id: true },
          });

          await prisma.asistencia.create({
            data: {
              colegioId: alumno.colegioId,
              alumnoId: alumno.id,
              fecha: new Date(),
              estado: 'PRESENTE',
              registradoPor: admin?.id || alumno.colegioId,
            },
          });
          asistenciaRegistrada = true;
          estadoAsistencia = 'PRESENTE';
        } else {
          estadoAsistencia = existing.estado;
        }
      }

      res.json({
        verificado: true,
        asistenciaRegistrada,
        estadoAsistencia,
        alumno: {
          id: alumno.id,
          codigo: alumno.codigo,
          nombre: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
          grado: alumno.grado?.nombre || '-',
          colegio: alumno.colegio.nombre,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

qrRoutes.get(
  '/:colegioId/alumnos/:alumnoId/qr',
  authMiddleware,
  tenantMiddleware,
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { colegioId, alumnoId } = req.params;

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, colegioId },
      });

      if (!alumno) {
        res.status(404).json({ error: 'Alumno no encontrado' });
        return;
      }

      const regenerar = req.query.regenerar === 'true';

      if (!alumno.qrToken || regenerar) {
        await prisma.alumno.update({
          where: { id: alumno.id },
          data: { qrToken: generateQrToken() },
        });
        alumno.qrToken = (await prisma.alumno.findUnique({ where: { id: alumno.id } }))?.qrToken || null;
      }

      res.json({
        alumnoId: alumno.id,
        codigo: alumno.codigo,
        nombre: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
        qrToken: alumno.qrToken,
        qrImage: `/api/qr/${alumno.qrToken}.png`,
        urlVerificacion: `/api/qr/${alumno.qrToken}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

qrRoutes.get(
  '/:colegioId/alumnos/:alumnoId/qr.png',
  authMiddleware,
  tenantMiddleware,
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { colegioId, alumnoId } = req.params;

      const alumno = await prisma.alumno.findFirst({
        where: { id: alumnoId, colegioId },
      });

      if (!alumno || !alumno.qrToken) {
        res.status(404).json({ error: 'Alumno sin código QR generado' });
        return;
      }

      const buffer = await qrPng(alumno.qrToken);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
);
