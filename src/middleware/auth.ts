import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from '../lib/utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        colegioId: string;
        rol: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autorización requerido' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwtVerify(token);
    req.user = {
      userId: payload.userId,
      colegioId: payload.colegioId,
      rol: payload.rol,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
