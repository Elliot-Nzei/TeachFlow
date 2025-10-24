
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccount } from '@/firebase/service-account';

function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return getAuth();
}

/**
 * Checks if any user exists in Firebase Authentication.
 * This is the most reliable way to determine if the first user is registering.
 * @returns {Promise<boolean>} True if one or more users exist, false otherwise.
 */
export async function checkIfAnyUserExists(): Promise<boolean> {
  const auth = getAdminAuth();
  try {
    // We only need to see if there's at least one user.
    // Fetching a single user is efficient.
    const userRecords = await auth.listUsers(1);
    return userRecords.users.length > 0;
  } catch (error) {
    console.error("Error checking for user existence in Firebase Auth:", error);
    // In case of an error, default to true to prevent accidentally creating multiple admins.
    return true;
  }
}
