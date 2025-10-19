
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { serviceAccount } from '@/firebase/service-account'; // Using a service account for admin access

// Initialize Firebase Admin SDK
function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  return getFirestore();
}

export async function getStudentByParentId(parentId: string) {
  const db = getDb();
  if (!parentId) {
    return { error: 'Parent ID is required.' };
  }

  try {
    const studentsRef = db.collectionGroup('students');
    const q = studentsRef.where('parentId', '==', parentId);
    const studentSnapshot = await q.get();

    if (studentSnapshot.empty) {
      return { error: 'Invalid Parent ID.' };
    }

    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentRef = studentDoc.ref;
    const userUid = studentRef.parent.parent?.id; // Get the user ID from the path

    if (!userUid) {
      return { error: 'Could not determine the student\'s associated user.' };
    }

    // --- Access Limit Logic ---
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const lastAccessMonth = studentData.lastAccessMonth || '';
    let accessCount = studentData.parentAccessCount || 0;

    if (lastAccessMonth !== currentMonth) {
      accessCount = 0;
    }

    if (accessCount >= 3) {
      return { error: 'Monthly access limit reached. Please try again next month.' };
    }

    // Increment access count
    await studentRef.update({
        parentAccessCount: accessCount + 1,
        lastAccessMonth: currentMonth
    });

    // Fetch grades for the student
    const gradesRef = db.collection(`users/${userUid}/grades`);
    const gradesQuery = gradesRef.where('studentId', '==', studentDoc.id);
    const gradesSnapshot = await gradesQuery.get();
    const grades = gradesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    // Helper to convert Timestamps to JSON-serializable strings
    const toJSON = (data: any) => {
        if (data && typeof data === 'object') {
            for (const key in data) {
                if (data[key] instanceof Timestamp) {
                    data[key] = data[key].toDate().toISOString();
                } else if (typeof data[key] === 'object') {
                    toJSON(data[key]); // Recurse
                }
            }
        }
        return data;
    };
    
    const finalStudentData = toJSON({ ...studentData, id: studentDoc.id });
    const finalGrades = grades.map(g => toJSON(g));

    return {
      data: {
        ...finalStudentData,
        grades: finalGrades,
      }
    };

  } catch (err) {
      console.error("Error in getStudentByParentId:", err);
      // This will now be caught by the frontend and show the generic error
      throw new Error("A server error occurred while fetching student data.");
  }
}
