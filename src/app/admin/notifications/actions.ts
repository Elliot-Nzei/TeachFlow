
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  };
}

export async function deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !notificationId) {
    return { success: false, error: "User ID and Notification ID are required." };
  }

  try {
    const { db } = initializeAdmin();
    const notificationRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);
    await notificationRef.delete();

    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}

export async function clearAllNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required." };
  }
  
  try {
    const { db } = initializeAdmin();
    const notificationsRef = db.collection('users').doc(userId).collection('notifications');
    const snapshot = await notificationsRef.get();

    if (snapshot.empty) {
      return { success: true }; // Nothing to delete
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}
