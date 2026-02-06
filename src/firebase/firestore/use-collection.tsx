
'use client';

import { useState, useEffect, useRef } from 'react';
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
 * Robust implementation to avoid SDK internal assertion errors during rapid re-renders.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous listener immediately
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        // Silent catch for internal SDK cleanup errors
      }
      unsubscribeRef.current = null;
    }

    if (!memoizedTargetRefOrQuery) {
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
          
          if (err.code === 'permission-denied') {
            // Try to extract a meaningful path if it's a collection reference
            const path = 'path' in memoizedTargetRefOrQuery 
              ? memoizedTargetRefOrQuery.path 
              : 'query-result';

            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: path,
            });
            setError(contextualError);
            setData(null);
            setIsLoading(false);
            
            // Critical: Delay emission to let SDK finish its internal state cycle
            setTimeout(() => {
              if (isMounted) {
                errorEmitter.emit('permission-error', contextualError);
              }
            }, 500);
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
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
