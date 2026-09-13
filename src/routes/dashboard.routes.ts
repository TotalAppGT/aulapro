import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { requireRole } from '../lib/roles';

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);
dashboardRoutes.use(tenantMiddleware);

function mesActual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

dashboardRoutes.get(
  '/stats',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const mes = (req.query.mes as string) || mesActual();
      const now = new Date();

      const [totalAlumnos, mensualidadesMes] = await Promise.all([
        prisma.alumno.count({ where: { colegioId, activo: true } }),
        prisma.mensualidad.findMany({
          where: { colegioId, mes },
        }),
      ]);

      const pagados = mensualidadesMes.filter((m) => m.estado === 'PAGADO');
      const vencidos = mensualidadesMes.filter((m) => m.estado === 'VENCIDO');

      const totalRecaudado = pagados.reduce((sum, m) => sum + m.monto, 0);
      const totalPendiente = mensualidadesMes
        .filter((m) => m.estado !== 'PAGADO')
        .reduce((sum, m) => sum + m.monto, 0);
      const moraActual = vencidos.reduce((sum, m) => sum + m.monto, 0);
      const comisionDelMes = pagados.reduce((sum, m) => sum + (m.comisionPlataforma || 0), 0);

      const proximaFechaCobro = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      ).toISOString();

      res.json({
        totalAlumnos,
        pagosDelMes: pagados.length,
        totalRecaudado,
        totalPendiente,
        moraActual,
        porcentajeCompletado:
          mensualidadesMes.length === 0
            ? 0
            : Math.round((pagados.length / mensualidadesMes.length) * 1000) / 10,
        proximaFechaCobro,
        comisionDelMes,
      });
    } catch (err) {
      next(err);
    }
  }
);

dashboardRoutes.get(
  '/historial',
  requireRole('ADMIN_COLEGIO', 'PROFESOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const colegioId = req.user!.colegioId;
      const now = new Date();

      const meses: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const mensualidades = await prisma.mensualidad.findMany({
        where: { colegioId, mes: { in: meses } },
      });

      const historial = meses.map((mes) => {
        const delMes = mensualidades.filter((m) => m.mes === mes);
        return {
          mes,
          recaudado: delMes
            .filter((m) => m.estado === 'PAGADO')
            .reduce((sum, m) => sum + m.monto, 0),
          pendiente: delMes
            .filter((m) => m.estado !== 'PAGADO')
            .reduce((sum, m) => sum + m.monto, 0),
        };
      });

      res.json(historial);
    } catch (err) {
      next(err);
    }
  }
);
