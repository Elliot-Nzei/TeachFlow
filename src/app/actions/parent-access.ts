'use server';

import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { getApps } from 'firebase/app';

// This is a server-side only file. We need to initialize a separate Firebase app instance
// to interact with Firestore from the server.
function getDb() {
  const { firestore } = initializeFirebase();
  return firestore;
}

export async function getStudentByParentId(parentId: string) {
  const db = getDb();
  if (!parentId) {
    return { error: 'Parent ID is required.' };
  }

  // Find the user that has this student
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);
  
  let studentDoc = null;
  let userUid = null;

  for (const userDoc of usersSnapshot.docs) {
    const studentsRef = collection(db, `users/${userDoc.id}/students`);
    const q = query(studentsRef, where('parentId', '==', parentId));
    const studentSnapshot = await getDocs(q);
    
    if (!studentSnapshot.empty) {
      studentDoc = studentSnapshot.docs[0];
      userUid = userDoc.id;
      break;
    }
  }

  if (!studentDoc || !userUid) {
    return { error: 'Invalid Parent ID.' };
  }

  const studentData = { ...studentDoc.data(), id: studentDoc.id };

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
  await updateDoc(doc(db, `users/${userUid}/students`, studentDoc.id), {
      parentAccessCount: increment(1),
      lastAccessMonth: currentMonth
  });
  
  // Fetch grades for the student
  const gradesRef = collection(db, `users/${userUid}/grades`);
  const gradesQuery = query(gradesRef, where('studentId', '==', studentDoc.id));
  const gradesSnapshot = await getDocs(gradesQuery);
  const grades = gradesSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

  return {
    data: {
      ...studentData,
      grades: grades,
    }
  };
}
