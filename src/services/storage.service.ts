import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_URL, R2_REGION } from '../config';

const s3Client = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

export function storageConfigured(): boolean {
  return Boolean(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

export async function uploadFile(
  colegioId: string,
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `colegios/${colegioId}/${folder}/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  if (!storageConfigured()) return;
  await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export function getPublicUrl(key: string): string {
  const baseUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${baseUrl}/${cleanKey}`;
}

export async function getSignedUrlForKey(key: string, expiresIn = 604800): Promise<string> {
  if (!storageConfigured()) return R2_PUBLIC_URL ? getPublicUrl(key) : '';
  if (R2_PUBLIC_URL) return getPublicUrl(key);

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn },
  );
}
