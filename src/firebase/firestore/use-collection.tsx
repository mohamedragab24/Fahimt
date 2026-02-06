
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
 * Improved implementation to handle SDK internal assertion errors gracefully.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous listener if any
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (e) {
        console.warn('Silent cleanup error:', e);
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
          
          // Handle permission errors gracefully
          if (err.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: 'collection',
            });
            setError(contextualError);
            setData(null);
            setIsLoading(false);
            
            // Emit after a small delay to avoid interrupting SDK internal state
            setTimeout(() => {
              errorEmitter.emit('permission-error', contextualError);
            }, 100);
          } else {
            setError(err);
            setIsLoading(false);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err: any) {
      console.error('Failed to establish Firestore listener:', err);
      setIsLoading(false);
      setError(err);
    }

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (e) {
          // SDK assertion failure often happens during this call
          console.warn('Caught SDK assertion during unsubscribe:', e);
        }
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
