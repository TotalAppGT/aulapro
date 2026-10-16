import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { generateQrToken, qrPng } from '../services/qr.service';

export const qrRoutes = Router();

// PNG publico (debe ir antes de '/qr/:qrToken' para que no lo capture)
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

// Verificacion publica del QR (JSON o tarjeta HTML si la abre un navegador)
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

    const nombre = `${alumno.nombre} ${alumno.apellido || ''}`.trim();
    const grado = alumno.grado?.nombre || '-';

    if ((req.headers.accept || '').includes('text/html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AulaPro - ${nombre}</title></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center">
  <div style="background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:28px;max-width:360px;width:90%;text-align:center">
    <div style="background:#059669;color:#fff;border-radius:12px;padding:16px;font-size:18px;font-weight:700">AulaPro · Verificación</div>
    <p style="margin:20px 0 4px;font-size:22px;font-weight:800;color:#111827">${nombre}</p>
    <p style="margin:0;color:#6b7280">Código ${alumno.codigo}</p>
    <p style="margin:8px 0 0;color:#374151"><strong>${grado}</strong></p>
    <p style="margin:8px 0 0;color:#6b7280;font-size:14px">${alumno.colegio.nombre}</p>
    <div style="margin-top:20px;padding:10px;border-radius:10px;background:#ecfdf5;color:#047857;font-weight:600">✓ Alumno verificado</div>
  </div>
</body></html>`);
      return;
    }

    res.json({
      verificado: true,
      alumnoId: alumno.id,
      codigo: alumno.codigo,
      nombre,
      grado,
      colegio: alumno.colegio.nombre,
    });
  } catch (err) {
    next(err);
  }
});

qrRoutes.post('/qr/verificar', async (req: Request, res: Response, next: NextFunction) => {
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

      const existing = await prisma.asistencia.findFirst({
        where: { colegioId: alumno.colegioId, alumnoId: alumno.id, fecha: hoy },
      });

      if (!existing) {
        const marcador = await prisma.usuario.findFirst({
          where: { colegioId: alumno.colegioId, rol: 'ADMIN_COLEGIO', activo: true },
          select: { id: true },
        });

        await prisma.asistencia.create({
          data: {
            colegioId: alumno.colegioId,
            alumnoId: alumno.id,
            fecha: new Date(),
            estado: 'PRESENTE',
            registradoPor: marcador?.id || alumno.colegioId,
          },
        });
        asistenciaRegistrada = true;
        estadoAsistencia = 'PRESENTE';
      } else if (existing.estado === 'AUSENTE') {
        await prisma.asistencia.update({
          where: { id: existing.id },
          data: { estado: 'PRESENTE', justificacion: null },
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
});

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
        const updated = await prisma.alumno.update({
          where: { id: alumno.id },
          data: { qrToken: generateQrToken() },
        });
        alumno.qrToken = updated.qrToken;
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
