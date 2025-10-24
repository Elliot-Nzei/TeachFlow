
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

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number, exceptions: string[] = []) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject, exceptions);
  });
}

async function deleteQueryBatch(db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void, exceptions: string[] = []) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    return resolve(0);
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    if (!exceptions.includes(doc.id)) {
        batch.delete(doc.ref);
    }
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve, reject, exceptions);
  });
}

export async function deleteAllData(adminUid: string): Promise<{ success: boolean; error?: string; deletedUsers?: number }> {
  if (!adminUid) {
    return { success: false, error: "Administrator UID is required." };
  }

  try {
    const { db, auth } = initializeAdmin();

    // 1. List all users and filter out the admin to get a list of users to delete from Auth.
    const listUsersResult = await auth.listUsers(1000);
    const uidsToDelete = listUsersResult.users
        .filter(userRecord => userRecord.uid !== adminUid)
        .map(userRecord => userRecord.uid);
    const deletedUserCount = uidsToDelete.length;

    // 2. Delete all non-admin user documents from Firestore's 'users' collection first.
    const usersCollectionRef = db.collection('users');
    const deleteUserDocsPromises = uidsToDelete.map(uid => usersCollectionRef.doc(uid).delete());
    await Promise.all(deleteUserDocsPromises);

    // 3. Delete other top-level collections entirely.
    const topLevelCollections = ['parents', 'marketplace_products'];
    for (const collectionName of topLevelCollections) {
      await deleteCollection(db, collectionName, 100);
    }
    
    // 4. Delete subcollections for the admin user.
    const adminUserRef = db.collection('users').doc(adminUid);
    const subcollections = await adminUserRef.listCollections();
    for (const subcollection of subcollections) {
        await deleteCollection(db, subcollection.path, 100);
    }

    // 5. Finally, delete the non-admin users from Firebase Authentication.
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
