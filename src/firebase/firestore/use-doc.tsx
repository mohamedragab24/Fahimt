
'use client';

import { useState, useEffect, useRef } from 'react';
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
 * Robust implementation to avoid SDK internal assertion errors during rapid re-renders.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        // Silent catch
      }
      unsubscribeRef.current = null;
    }

    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let isMounted = true;

    try {
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
          
          if (err.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'get',
              path: memoizedDocRef.path,
            });
            setError(contextualError);
            setData(null);
            setIsLoading(false);

            setTimeout(() => {
              if (isMounted) {
                errorEmitter.emit('permission-error', contextualError);
              }
            }, 250);
          } else {
            setError(err);
            setIsLoading(false);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      if (isMounted) {
        setIsLoading(false);
        setError(err);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        const unsub = unsubscribeRef.current;
        unsubscribeRef.current = null;
        try {
          unsub();
        } catch (e) {
          // Prevent unhandled rejection during unmount
        }
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
