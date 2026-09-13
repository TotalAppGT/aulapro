import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { uploadFile, getSignedUrlForKey, storageConfigured } from '../services/storage.service';

export const uploadRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

uploadRoutes.use(authMiddleware);

uploadRoutes.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!storageConfigured()) {
      res.status(503).json({ error: 'Almacenamiento no configurado' });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Archivo requerido' });
      return;
    }
    const folder = typeof req.query.folder === 'string' ? req.query.folder : 'archivos';
    const key = await uploadFile(req.user!.colegioId, folder, file.originalname, file.buffer, file.mimetype);
    const url = await getSignedUrlForKey(key);
    res.status(201).json({
      key,
      url,
      nombre: file.originalname,
      tipo: file.mimetype,
      tamano: file.size,
    });
  } catch (err) {
    next(err);
  }
});

uploadRoutes.get('/signed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key : '';
    if (!key) {
      res.status(400).json({ error: 'key requerido' });
      return;
    }
    const url = await getSignedUrlForKey(key);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});
