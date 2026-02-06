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

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Robust implementation to avoid SDK "Internal Assertion Failed" errors.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Track if the hook is still mounted to avoid state updates on unmounted components
    let isMounted = true;

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!isMounted) return;
        const results: WithId<T>[] = [];
        snapshot.forEach((doc) => {
          results.push({ ...(doc.data() as T), id: doc.id });
        });
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        if (!isMounted) return;
        
        if (err.code !== 'permission-denied') {
          setError(err);
          setIsLoading(false);
          return;
        }

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'collection',
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Emit with a delay to ensure SDK handles its internal state first
        setTimeout(() => {
          errorEmitter.emit('permission-error', contextualError);
        }, 0);
      }
    );

    return () => {
      isMounted = false;
      try {
        unsubscribe();
      } catch (e) {
        // Silently catch unsubscription errors to avoid SDK assertion crashes
        console.warn('Firestore unsubscription error caught:', e);
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
