import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

export async function uploadFile(
  colegioId: string,
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const key = `colegios/${colegioId}/${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return getPublicUrl(key);
}

export function getPublicUrl(key: string): string {
  const baseUrl = R2_PUBLIC_URL.replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${baseUrl}/${cleanKey}`;
}
