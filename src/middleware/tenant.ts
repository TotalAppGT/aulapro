import { Request, Response, NextFunction } from 'express';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const colegioIdParam = req.params.colegioId;

  if (!colegioIdParam) {
    next();
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }

  if (req.user.rol === 'SUPERADMIN') {
    next();
    return;
  }

  if (req.user.colegioId !== colegioIdParam) {
    res.status(403).json({ error: 'No tienes acceso a este colegio' });
    return;
  }

  next();
}
