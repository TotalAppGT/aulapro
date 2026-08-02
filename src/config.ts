import dotenv from 'dotenv';

dotenv.config();

export const PORT = parseInt(process.env.PORT || '3000', 10);
export const NODE_ENV = process.env.NODE_ENV || (process.env.RAILWAY_ENVIRONMENT === 'production' ? 'production' : 'development');
export const JWT_SECRET = process.env.JWT_SECRET || 'aulapro-dev-secret';

export const RECURRENTE_BASE_URL = process.env.RECURRENTE_BASE_URL || 'https://app.recurrente.com/api';
export const RECURRENTE_SECRET_KEY = process.env.RECURRENTE_SECRET_KEY || '';
export const RECURRENTE_ACCOUNT_ID = process.env.RECURRENTE_ACCOUNT_ID || '';

export const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
export const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
export const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'AulaPro <no-reply@totalappgt.online>';

export const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
export const R2_BUCKET = process.env.R2_BUCKET_NAME || '';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
export const R2_REGION = process.env.R2_REGION || 'auto';

export const APP_URL = process.env.APP_URL || 'https://totalappgt.online';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || (NODE_ENV === 'production' ? APP_URL : 'http://localhost:5173');

const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  jwtSecret: JWT_SECRET,
  appUrl: APP_URL,
  corsOrigin: CORS_ORIGIN,
  recurrente: {
    baseUrl: RECURRENTE_BASE_URL,
    secretKey: RECURRENTE_SECRET_KEY,
  },
  firebase: {
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY,
  },
  resend: {
    apiKey: RESEND_API_KEY,
    fromEmail: RESEND_FROM_EMAIL,
  },
  whatsapp: {
    phoneId: WHATSAPP_PHONE_ID,
    accessToken: WHATSAPP_TOKEN,
    apiVersion: 'v19.0' as const,
  },
  r2: {
    endpoint: R2_ENDPOINT,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL,
    region: R2_REGION,
  },
};

export default config;
