
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccount } from '@/firebase/service-account';
import type { Firestore, Query } from 'firebase-admin/firestore';

// Types for better type safety
interface AdminServices {
  db: Firestore;
  auth: ReturnType<typeof getAuth>;
}

interface DeleteResult {
  success: boolean;
  error?: string;
  deletedUsers?: number;
  deletedCollections?: string[];
  details?: {
    firestoreUsers: number;
    authUsers: number;
    subcollections: number;
  };
}

interface VerifyAdminResult {
  isAdmin: boolean;
  error?: string;
}

// Constants
const BATCH_SIZE = 500; // Maximum batch size for Firestore
const MAX_AUTH_DELETE_BATCH = 1000; // Firebase Auth limit
const PROTECTED_COLLECTIONS = ['settings', 'system_config']; // Collections to never delete

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 */
function initializeAdmin(): AdminServices {
  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
  }
  
  return {
    db: getFirestore(),
    auth: getAuth()
  };
}

/**
 * Verify that the requesting user is an admin
 */
export async function verifyAdmin(uid: string): Promise<VerifyAdminResult> {
  if (!uid || typeof uid !== 'string') {
    return { isAdmin: false, error: 'Invalid user ID' };
  }

  try {
    const { db } = initializeAdmin();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return { isAdmin: false, error: 'User document not found' };
    }
    
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';
    
    return { 
      isAdmin, 
      error: isAdmin ? undefined : 'User is not an administrator' 
    };
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return { 
      isAdmin: false, 
      error: error instanceof Error ? error.message : 'Unknown error during verification' 
    };
  }
}

/**
 * Delete a Firestore collection in batches
 */
async function deleteCollection(
  db: Firestore, 
  collectionPath: string, 
  batchSize: number = BATCH_SIZE,
  exceptions: string[] = []
): Promise<number> {
  const collectionRef = db.collection(collectionPath);
  let deletedCount = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const query = collectionRef.orderBy('__name__').limit(batchSize);
      const snapshot = await query.get();

      if (snapshot.size === 0) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      let batchCount = 0;

      snapshot.docs.forEach((doc) => {
        if (!exceptions.includes(doc.id)) {
          batch.delete(doc.ref);
          batchCount++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        deletedCount += batchCount;
      }

      // If we got fewer documents than the batch size, we're done
      if (snapshot.size < batchSize) {
        hasMore = false;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error(`Error deleting collection ${collectionPath}:`, error);
    throw new Error(`Failed to delete collection ${collectionPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete all subcollections for a given document
 */
async function deleteAllSubcollections(
  db: Firestore,
  documentPath: string,
  batchSize: number = BATCH_SIZE
): Promise<number> {
  let totalDeleted = 0;
  
  try {
    const docRef = db.doc(documentPath);
    const subcollections = await docRef.listCollections();
    
    for (const subcollection of subcollections) {
      const deleted = await deleteCollection(db, subcollection.path, batchSize);
      totalDeleted += deleted;
    }
    
    return totalDeleted;
  } catch (error) {
    console.error(`Error deleting subcollections for ${documentPath}:`, error);
    throw error;
  }
}

/**
 * Delete users from Firebase Authentication in batches
 */
async function deleteAuthUsers(auth: ReturnType<typeof getAuth>, uids: string[]): Promise<number> {
  if (uids.length === 0) return 0;

  let deletedCount = 0;
  
  try {
    // Process in batches of 1000 (Firebase Auth limit)
    for (let i = 0; i < uids.length; i += MAX_AUTH_DELETE_BATCH) {
      const batch = uids.slice(i, i + MAX_AUTH_DELETE_BATCH);
      const result = await auth.deleteUsers(batch);
      deletedCount += result.successCount;
      
      if (result.failureCount > 0) {
        console.warn(`Failed to delete ${result.failureCount} users from Auth`);
        result.errors.forEach(err => {
          console.error(`Error deleting user ${err.index}:`, err.error);
        });
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting auth users:', error);
    throw new Error(`Failed to delete authentication users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to delete all data except admin user
 */
export async function deleteAllData(adminUid: string): Promise<DeleteResult> {
  // Input validation
  if (!adminUid || typeof adminUid !== 'string') {
    return { success: false, error: 'Administrator UID is required and must be a valid string' };
  }

  try {
    const { db, auth } = initializeAdmin();

    // Step 1: Verify the requesting user is actually an admin
    const adminCheck = await verifyAdmin(adminUid);
    if (!adminCheck.isAdmin) {
      return { 
        success: false, 
        error: `Access denied: ${adminCheck.error || 'User is not an administrator'}` 
      };
    }

    // Step 2: Get all users from Authentication
    const listUsersResult = await auth.listUsers(1000);
    const allUsers = [...listUsersResult.users];
    
    // Handle pagination if there are more than 1000 users
    let pageToken = listUsersResult.pageToken;
    while (pageToken) {
      const nextPage = await auth.listUsers(1000, pageToken);
      allUsers.push(...nextPage.users);
      pageToken = nextPage.pageToken;
    }

    // Filter out the admin user
    const uidsToDelete = allUsers
      .filter(userRecord => userRecord.uid !== adminUid)
      .map(userRecord => userRecord.uid);

    // Step 3: Delete user subcollections first (to avoid orphaned data)
    let subcollectionCount = 0;
    for (const uid of uidsToDelete) {
      try {
        const deleted = await deleteAllSubcollections(db, `users/${uid}`, BATCH_SIZE);
        subcollectionCount += deleted;
      } catch (error) {
        console.error(`Error deleting subcollections for user ${uid}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Step 4: Delete non-admin user documents from Firestore
    const usersCollectionRef = db.collection('users');
    let firestoreUserCount = 0;
    
    // Delete in batches to avoid overwhelming Firestore
    for (let i = 0; i < uidsToDelete.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchUids = uidsToDelete.slice(i, i + BATCH_SIZE);
      
      batchUids.forEach(uid => {
        batch.delete(usersCollectionRef.doc(uid));
      });
      
      await batch.commit();
      firestoreUserCount += batchUids.length;
    }

    // Step 5: Delete other top-level collections (except protected ones)
    const allCollections = await db.listCollections();
    const collectionsToDelete = allCollections
      .map(col => col.id)
      .filter(name => 
        name !== 'users' && 
        !PROTECTED_COLLECTIONS.includes(name)
      );

    const deletedCollections: string[] = [];
    for (const collectionName of collectionsToDelete) {
      try {
        await deleteCollection(db, collectionName, BATCH_SIZE);
        deletedCollections.push(collectionName);
      } catch (error) {
        console.error(`Error deleting collection ${collectionName}:`, error);
        // Continue with other collections
      }
    }

    // Step 6: Delete admin user's subcollections (preserve admin user document)
    const adminSubcollectionCount = await deleteAllSubcollections(
      db, 
      `users/${adminUid}`, 
      BATCH_SIZE
    );

    // Step 7: Delete users from Firebase Authentication
    const authDeletedCount = await deleteAuthUsers(auth, uidsToDelete);

    return {
      success: true,
      deletedUsers: authDeletedCount,
      deletedCollections,
      details: {
        firestoreUsers: firestoreUserCount,
        authUsers: authDeletedCount,
        subcollections: subcollectionCount + adminSubcollectionCount
      }
    };

  } catch (error) {
    console.error('Critical error during data deletion:', error);
    
    return {
      success: false,
      error: error instanceof Error 
        ? `Data deletion failed: ${error.message}` 
        : 'An unknown error occurred during data deletion'
    };
  }
}

/**
 * Get statistics about current data (useful before deletion)
 */
export async function getDataStats(adminUid: string): Promise<{
  success: boolean;
  error?: string;
  stats?: {
    totalUsers: number;
    totalAuthUsers: number;
    collections: string[];
    adminSubcollections: number;
  };
}> {
  if (!adminUid) {
    return { success: false, error: 'Administrator UID is required' };
  }

  try {
    const { db, auth } = initializeAdmin();

    // Verify admin
    const adminCheck = await verifyAdmin(adminUid);
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error || 'Access denied' };
    }

    // Get users count from Firestore
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get auth users count
    const listUsersResult = await auth.listUsers(1);
    
    // Get all collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);

    // Get admin subcollections count
    const adminRef = db.collection('users').doc(adminUid);
    const adminSubcollections = await adminRef.listCollections();

    return {
      success: true,
      stats: {
        totalUsers,
        totalAuthUsers: listUsersResult.pageToken ? 1000 : listUsersResult.users.length,
        collections: collectionNames,
        adminSubcollections: adminSubcollections.length
      }
    };
  } catch (error) {
    console.error('Error getting data stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
