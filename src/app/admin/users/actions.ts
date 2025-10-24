
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccount } from '@/firebase/service-account';
import { revalidatePath } from 'next/cache';

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

export async function changeUserRole(uid: string, newRole: 'admin' | 'teacher'): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, auth } = initializeAdmin();
    
    // Set custom claim for role-based security rules
    await auth.setCustomUserClaims(uid, { role: newRole });
    
    // Update role in Firestore document for application logic
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ role: newRole });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("Error changing user role:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}

export async function changeUserPlan(uid: string, newPlan: 'free_trial' | 'basic' | 'prime'): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = initializeAdmin();
    
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ 
      plan: newPlan,
      // Reset plan start date when plan changes
      planStartDate: new Date()
    });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("Error changing user plan:", error);
     if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}

export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
   try {
    const { db, auth } = initializeAdmin();

    // 1. Delete user from Firebase Authentication
    await auth.deleteUser(uid);

    // 2. Delete user's Firestore document and all their subcollections
    const userRef = db.collection('users').doc(uid);
    const subcollections = await userRef.listCollections();
    
    for (const subcollection of subcollections) {
        const docs = await subcollection.get();
        const batch = db.batch();
        docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    
    await userRef.delete();

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("Error deleting user:", error);
     if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
}
