import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';
import { getSignedUrlForKey, deleteFile } from '../services/storage.service';

export const cursoRoutes = Router();

cursoRoutes.use(authMiddleware);
cursoRoutes.use(tenantMiddleware);

function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const cursoSchema = z.object({
  gradoId: z.string().min(1),
  materiaId: z.string().optional().nullable(),
  profesorId: z.string().optional().nullable(),
  nombre: z.string().min(2).max(150),
  descripcion: z.string().max(1000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

const materialSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  tipo: z.enum(['ARCHIVO', 'ENLACE', 'VIDEO']).default('ARCHIVO'),
  key: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
});

const postSchema = z.object({
  contenido: z.string().min(1).max(4000),
  archivos: z.array(z.string()).default([]),
});

const comentarioSchema = z.object({
  contenido: z.string().min(1).max(2000),
});

const sesionSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  fecha: z.string().min(1),
  duracionMin: z.number().int().min(5).max(600).default(60),
  proveedor: z.enum(['JITSI', 'MEET', 'ZOOM', 'OTRO']).default('JITSI'),
  url: z.string().optional().nullable(),
});

cursoRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const rol = req.user!.rol;
    const where: Record<string, unknown> = { colegioId, activo: true };
    if (rol === 'PROFESOR') where.profesorId = req.user!.userId;

    const cursos = await prisma.curso.findMany({
      where,
      include: {
        grado: { select: { id: true, nombre: true } },
        materia: { select: { id: true, nombre: true } },
        profesor: { select: { id: true, nombre: true } },
        _count: { select: { materiales: true, posts: true, sesiones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cursos);
  } catch (err) {
    next(err);
  }
});

cursoRoutes.post(
  '/',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = cursoSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const grado = await prisma.grado.findFirst({ where: { id: body.gradoId, colegioId } });
      if (!grado) {
        res.status(404).json({ error: 'Grado no encontrado' });
        return;
      }

      const curso = await prisma.curso.create({
        data: {
          colegioId,
          gradoId: body.gradoId,
          materiaId: body.materiaId || null,
          profesorId: body.profesorId || req.user!.userId,
          nombre: body.nombre,
          descripcion: body.descripcion || null,
          color: body.color || null,
        },
      });
      res.status(201).json(curso);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

cursoRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const curso = await prisma.curso.findFirst({
      where: { id: req.params.id, colegioId },
      include: {
        grado: { select: { id: true, nombre: true, nivel: true } },
        materia: { select: { id: true, nombre: true } },
        profesor: { select: { id: true, nombre: true } },
        _count: { select: { materiales: true, posts: true, sesiones: true } },
      },
    });
    if (!curso) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }
    res.json(curso);
  } catch (err) {
    next(err);
  }
});

// -------- Materiales --------
cursoRoutes.get('/:id/materiales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const materiales = await prisma.material.findMany({
      where: { colegioId, cursoId: req.params.id },
      include: { creador: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const conUrl = await Promise.all(
      materiales.map(async (m) => ({
        ...m,
        signedUrl: m.key ? await getSignedUrlForKey(m.key) : m.url,
      }))
    );
    res.json(conUrl);
  } catch (err) {
    next(err);
  }
});

cursoRoutes.post(
  '/:id/materiales',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = materialSchema.parse(req.body);
      const colegioId = req.user!.colegioId;

      const curso = await prisma.curso.findFirst({ where: { id: req.params.id, colegioId } });
      if (!curso) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }

      const material = await prisma.material.create({
        data: {
          colegioId,
          cursoId: req.params.id,
          titulo: body.titulo,
          descripcion: body.descripcion || null,
          tipo: body.tipo,
          key: body.key || null,
          url: body.url || null,
          creadoPor: req.user!.userId,
        },
      });
      res.status(201).json(material);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

cursoRoutes.delete(
  '/materiales/:materialId',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const material = await prisma.material.findFirst({
        where: { id: req.params.materialId, colegioId },
      });
      if (!material) {
        res.status(404).json({ error: 'Material no encontrado' });
        return;
      }
      if (material.key) await deleteFile(material.key).catch(() => {});
      await prisma.material.delete({ where: { id: material.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// -------- Muro --------
cursoRoutes.get('/:id/muro', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const posts = await prisma.muroPost.findMany({
      where: { colegioId, cursoId: req.params.id },
      include: {
        autor: { select: { id: true, nombre: true, rol: true } },
        comentarios: {
          include: { autor: { select: { id: true, nombre: true, rol: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

cursoRoutes.post(
  '/:id/muro',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = postSchema.parse(req.body);
      const colegioId = req.user!.colegioId;
      const curso = await prisma.curso.findFirst({ where: { id: req.params.id, colegioId } });
      if (!curso) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }
      const post = await prisma.muroPost.create({
        data: {
          colegioId,
          cursoId: req.params.id,
          autorId: req.user!.userId,
          contenido: body.contenido,
          archivos: body.archivos,
        },
      });
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

cursoRoutes.post('/:id/muro/:postId/comentarios', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = comentarioSchema.parse(req.body);
    const colegioId = req.user!.colegioId;
    const post = await prisma.muroPost.findFirst({
      where: { id: req.params.postId, colegioId, cursoId: req.params.id },
    });
    if (!post) {
      res.status(404).json({ error: 'Publicación no encontrada' });
      return;
    }
    const comentario = await prisma.muroComentario.create({
      data: { postId: post.id, autorId: req.user!.userId, contenido: body.contenido },
    });
    res.status(201).json(comentario);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: err.errors });
      return;
    }
    next(err);
  }
});

// -------- Sesiones en vivo --------
cursoRoutes.get('/:id/sesiones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colegioId = req.user!.colegioId;
    const sesiones = await prisma.sesionEnVivo.findMany({
      where: { colegioId, cursoId: req.params.id },
      include: { creador: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json(sesiones);
  } catch (err) {
    next(err);
  }
});

cursoRoutes.post(
  '/:id/sesiones',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = sesionSchema.parse(req.body);
      const colegioId = req.user!.colegioId;
      const curso = await prisma.curso.findFirst({
        where: { id: req.params.id, colegioId },
        include: { colegio: { select: { nombre: true } } },
      });
      if (!curso) {
        res.status(404).json({ error: 'Curso no encontrado' });
        return;
      }

      let url = body.url || '';
      if (!url && body.proveedor === 'JITSI') {
        const sala = `AulaPro-${slug(curso.colegio.nombre)}-${slug(curso.nombre)}`;
        url = `https://meet.jit.si/${sala}`;
      }
      if (!url) {
        res.status(400).json({ error: 'La URL es requerida para este proveedor' });
        return;
      }

      const sesion = await prisma.sesionEnVivo.create({
        data: {
          colegioId,
          cursoId: req.params.id,
          titulo: body.titulo,
          descripcion: body.descripcion || null,
          fecha: new Date(body.fecha),
          duracionMin: body.duracionMin,
          proveedor: body.proveedor,
          url,
          creadoPor: req.user!.userId,
        },
      });
      res.status(201).json(sesion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: err.errors });
        return;
      }
      next(err);
    }
  }
);

cursoRoutes.delete(
  '/sesiones/:sesionId',
  requireRole('PROFESOR', 'ADMIN_COLEGIO'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const sesion = await prisma.sesionEnVivo.findFirst({
        where: { id: req.params.sesionId, colegioId },
      });
      if (!sesion) {
        res.status(404).json({ error: 'Sesión no encontrada' });
        return;
      }
      await prisma.sesionEnVivo.delete({ where: { id: sesion.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);
