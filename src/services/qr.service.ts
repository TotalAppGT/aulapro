import crypto from 'crypto';
import QRCode from 'qrcode';
import { APP_URL } from '../config';

export function generateQrToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function qrUrl(token: string): string {
  return `${APP_URL}/api/qr/${token}`;
}

export async function qrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(qrUrl(token), {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(qrUrl(token), {
    errorCorrectionLevel: 'M',
    margin: 2,
  });
}
