import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

const MONTHS_ES: Record<string, string> = {
  '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC',
};

export function generateReference(colegioId: string, alumnoId: string, mes: string): string {
  const colegioPart = colegioId.substring(0, 4).toUpperCase();
  const alumnoPart = alumnoId.substring(alumnoId.length - 3).toUpperCase();
  const [year, month] = mes.split('-');
  const monthCode = MONTHS_ES[month] || month.toUpperCase();
  return `SAA-${colegioPart}-${alumnoPart}-${monthCode}${year}`;
}

export function jwtSign(userId: string, colegioId: string, rol: string): string {
  return jwt.sign({ userId, colegioId, rol }, JWT_SECRET, { expiresIn: '7d' });
}

export function jwtVerify(token: string): { userId: string; colegioId: string; rol: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; colegioId: string; rol: string };
}
