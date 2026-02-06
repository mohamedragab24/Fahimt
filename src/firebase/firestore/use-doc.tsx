'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Robust implementation to avoid SDK "Internal Assertion Failed" errors.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let isMounted = true;

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        if (!isMounted) return;
        
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
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
        console.warn('Firestore unsubscription error caught:', e);
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
