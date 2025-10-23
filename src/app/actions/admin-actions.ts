
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccount } from '@/firebase/service-account';

// Initialize Firebase Admin SDK
function initializeAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return {
    db: getFirestore(),
    auth: getAuth()
  };
}

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    return resolve(0);
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

export async function deleteAllData(): Promise<{ success: boolean; error?: string; deletedUsers?: number }> {
  try {
    const { db, auth } = initializeAdmin();

    // 1. List all users that need to be deleted from Auth later.
    const listUsersResult = await auth.listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(userRecord => userRecord.uid);
    const deletedUserCount = uidsToDelete.length;

    // 2. Delete all Firestore data first.
    const collections = ['users', 'parents', 'marketplace_products'];
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      const docs = await collectionRef.listDocuments();

      for (const docRef of docs) {
         const subcollections = await docRef.listCollections();
         for (const subcollection of subcollections) {
             await deleteCollection(db, subcollection.path, 100);
         }
         // Delete the main document after its subcollections.
         await docRef.delete();
      }
    }
    
    // 3. Now, delete all users from Firebase Authentication.
    if (deletedUserCount > 0) {
        await auth.deleteUsers(uidsToDelete);
    }

    return { success: true, deletedUsers: deletedUserCount };

  } catch (error) {
    console.error("Error deleting all data:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred during data deletion." };
  }
}
