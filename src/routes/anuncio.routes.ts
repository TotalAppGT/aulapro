import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const anuncioRoutes = Router();

anuncioRoutes.use(authMiddleware);
anuncioRoutes.use(tenantMiddleware);

anuncioRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anuncios = await prisma.anuncio.findMany({
      where: { colegioId: req.user!.colegioId },
      include: { creador: true, grado: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(anuncios);
  } catch (err) {
    next(err);
  }
});

anuncioRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { titulo, contenido, tipo, gradoId, enviarWhatsapp, enviarEmail, archivos } = req.body;
    const anuncio = await prisma.anuncio.create({
      data: {
        colegioId: req.user!.colegioId,
        titulo,
        contenido,
        tipo: tipo || 'GENERAL',
        gradoId: gradoId || null,
        enviarWhatsapp: enviarWhatsapp || false,
        enviarEmail: enviarEmail || false,
        archivos: archivos || [],
        creadoPor: req.user!.userId,
      },
    });
    res.status(201).json(anuncio);
  } catch (err) {
    next(err);
  }
});
