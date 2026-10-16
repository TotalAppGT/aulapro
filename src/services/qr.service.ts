import crypto from 'crypto';
import QRCode from 'qrcode';
import { APP_URL } from '../config';

const QRSERVER_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

export function generateQrToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function qrUrl(token: string): string {
  return `${APP_URL}/api/qr/${token}`;
}

export function qrImageUrl(data: string, size = 512): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    margin: '10',
    color: '0-0-0',
    bgcolor: '255-255-255',
    data,
  });
  return `${QRSERVER_BASE}?${params.toString()}`;
}

async function qrserverPng(data: string, size: number): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(qrImageUrl(data, size), { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    return buffer.length > 100 ? buffer : null;
  } catch (err) {
    console.warn('[QR] qrserver no disponible, se usa generador local:', (err as Error).message);
    return null;
  }
}

export async function qrPng(token: string, size = 512): Promise<Buffer> {
  const data = qrUrl(token);
  const remote = await qrserverPng(data, size);
  if (remote) return remote;
  return QRCode.toBuffer(data, {
    type: 'png',
    width: size,
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
