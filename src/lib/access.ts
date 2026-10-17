import { prisma } from './prisma';

export interface AuthUser {
  userId: string;
  colegioId: string;
  rol: string;
}

/**
 * Determina si el usuario autenticado puede ver los datos de un alumno.
 * - ADMIN_COLEGIO / PROFESOR / SUPERADMIN: cualquier alumno de su colegio.
 * - PADRE: solo sus hijos (responsableId).
 * - ALUMNO: solo su propio registro (Usuario.alumnoId).
 */
export async function puedeVerAlumno(user: AuthUser, alumnoId: string): Promise<boolean> {
  if (['ADMIN_COLEGIO', 'PROFESOR', 'SUPERADMIN'].includes(user.rol)) return true;

  const alumno = await prisma.alumno.findFirst({
    where: { id: alumnoId, colegioId: user.colegioId },
    select: { responsableId: true },
  });
  if (!alumno) return false;

  if (user.rol === 'PADRE') return alumno.responsableId === user.userId;

  if (user.rol === 'ALUMNO') {
    const u = await prisma.usuario.findUnique({
      where: { id: user.userId },
      select: { alumnoId: true },
    });
    return !!u?.alumnoId && u.alumnoId === alumnoId;
  }

  return false;
}
