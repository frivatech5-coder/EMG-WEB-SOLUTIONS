import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import fileConfig from '../firebase-applet-config.json';

/**
 * Firebase web config is public by design (security comes from Firestore/Storage rules).
 * Any VITE_FIREBASE_* variable overrides the matching value in firebase-applet-config.json.
 */
const env = import.meta.env as Record<string, string | undefined>;
const firebaseConfig = {
  ...fileConfig,
  apiKey: env.VITE_FIREBASE_API_KEY || fileConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || fileConfig.appId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || fileConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const hasStorage = Boolean(firebaseConfig.storageBucket);
export const storage = hasStorage ? getStorage(app) : null;

/** Comma-separated admin emails (UI hint only; Firestore rules are the real gate). */
export const ADMIN_EMAILS = (env.VITE_ADMIN_EMAILS || 'frivatech5@gmail.com').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Turn a Firebase error into a short message an administrator can act on. */
export function explainError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${host}" is not authorized in Firebase Authentication. Add it under Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (code === 'auth/popup-blocked') return 'Sign-in popup was blocked by your browser. Allow popups for this site and try again.';
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled before completing.';
  if (code.includes('permission-denied') || code.includes('unauthorized')) return 'Permission denied. Sign in with an administrator account and make sure the latest Firestore/Storage rules are deployed.';
  if (code.includes('unavailable') || code.includes('network')) return 'Could not reach Firebase. Check your internet connection and try again.';
  if (code.includes('not-found')) return 'The item no longer exists.';
  if (code.includes('quota')) return 'Firebase quota exceeded.';
  return (err as Error)?.message || 'Unexpected error.';
}
