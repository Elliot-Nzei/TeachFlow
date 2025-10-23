
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { serviceAccount } from '@/firebase/service-account';

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return getFirestore();
}

export async function checkIfAdminExists(): Promise<boolean> {
  const db = getDb();
  try {
    const adminQuery = db.collection('users').where('role', '==', 'admin').limit(1);
    const snapshot = await adminQuery.get();
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking for admin existence:", error);
    // In case of error, default to true to prevent accidental admin creation
    return true;
  }
}
