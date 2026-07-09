import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from './env.js';

let firestore: Firestore | null = null;

export function initFirebase(): Firestore {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
  }

  firestore = getAdminFirestore();
  return firestore;
}

export function getFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firestore is not initialized. Call initFirebase() first.');
  }

  return firestore;
}

export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    await getFirestore().listCollections();
    return true;
  } catch {
    return false;
  }
}
