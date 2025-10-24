
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';


/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references and optional admin role enforcement.
 *
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The memoized Firestore DocumentReference.
 * @param {object} [options] - Optional parameters.
 * @param {boolean} [options.requiresAdmin] - If true, the hook waits for user auth and verifies admin role before executing the query.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
  options: { requiresAdmin?: boolean } = {}
): UseDocResult<T> {
  const { isUserLoading, user, firestore } = useFirebase();
  const { requiresAdmin = false } = options;

  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(!requiresAdmin);
  const [isRoleChecked, setIsRoleChecked] = useState<boolean>(!requiresAdmin);

  useEffect(() => {
    if (!requiresAdmin || isUserLoading || !user) {
      if (!requiresAdmin) {
        setIsRoleChecked(true);
      }
      return;
    }
    
    setIsRoleChecked(false);
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsRoleChecked(true);
    }).catch(() => {
        setIsAdmin(false);
        setIsRoleChecked(true);
    });

  }, [requiresAdmin, user, isUserLoading, firestore]);

  useEffect(() => {
    // Wait until role check is complete if admin is required
    if (requiresAdmin && !isRoleChecked) {
      setIsLoading(true);
      return;
    }
    
    // If admin is required but user is not an admin, stop here.
    if (requiresAdmin && !isAdmin) {
      setData(null);
      setIsLoading(false);
      setError(new Error("You don't have permission to view this data."));
      return;
    }

    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!(memoizedDocRef as any).__memo) {
      console.warn("useDoc was called with a reference that was not created with useMemoFirebase. This can lead to infinite loops and performance issues.", memoizedDocRef);
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isUserLoading, isAdmin, isRoleChecked, requiresAdmin]);

  const finalLoadingState = isLoading || (requiresAdmin && !isRoleChecked) || isUserLoading;

  return { data, isLoading: finalLoadingState, error };
}
