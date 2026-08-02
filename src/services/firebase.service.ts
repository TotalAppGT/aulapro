import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } from '../config';

const isConfigured = Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);

if (!isConfigured) {
  console.warn('[Firebase] FIREBASE_* vars no configuradas. La verificacion de tokens quedara deshabilitada.');
}

let app: App | undefined;

if (isConfigured) {
  app = getApps()[0]
    || initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
}

export const firebaseAuth = app ? getAuth(app) : null;

export interface FirebaseClaims {
  uid: string;
  email?: string;
  email_verified?: boolean;
  role?: string;
}

export async function verifyIdToken(idToken: string): Promise<FirebaseClaims | null> {
  if (!isConfigured || !firebaseAuth) {
    return null;
  }
  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      email_verified: decoded.email_verified,
      role: decoded.role as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function setCustomRole(uid: string, role: string) {
  if (!isConfigured || !firebaseAuth) return;
  try {
    await firebaseAuth.setCustomUserClaims(uid, { role });
  } catch (err) {
    console.error('[Firebase] setCustomRole failed:', err);
  }
}
