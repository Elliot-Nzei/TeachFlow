
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries and optional admin role enforcement.
 *
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The memoized Firestore CollectionReference or Query.
 * @param {object} [options] - Optional parameters.
 * @param {boolean} [options.requiresAdmin] - If true, the hook waits for user auth and verifies admin role before executing the query.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: CollectionReference<DocumentData> | InternalQuery | null | undefined,
  options: { requiresAdmin?: boolean } = {}
): UseCollectionResult<T> {
  const { isUserLoading, user } = useFirebase();
  const { requiresAdmin = false } = options;

  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(!requiresAdmin);
  const [isRoleChecked, setIsRoleChecked] = useState<boolean>(!requiresAdmin);

  useEffect(() => {
    if (!requiresAdmin || isUserLoading || !user) {
      if (!requiresAdmin) {
        setIsRoleChecked(true); // No admin check needed
        setIsAdmin(false);
      }
      return;
    }
    
    setIsRoleChecked(false);
    user.getIdTokenResult()
        .then(idTokenResult => {
            const claims = idTokenResult.claims;
            if (claims && claims.admin === true) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setIsRoleChecked(true);
        })
        .catch(err => {
            console.error("Failed to get token claims", err);
            setIsAdmin(false);
            setIsRoleChecked(true);
        });

  }, [requiresAdmin, user, isUserLoading]);

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

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    if (!(memoizedTargetRefOrQuery as any).__memo) {
      console.warn("useCollection was called with a query that was not created with useMemoFirebase. This can lead to infinite loops and performance issues.", memoizedTargetRefOrQuery);
    }
    
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, isUserLoading, isAdmin, isRoleChecked, requiresAdmin]);

  const finalLoadingState = isLoading || (requiresAdmin && !isRoleChecked) || isUserLoading;

  return { data, isLoading: finalLoadingState, error };
}
