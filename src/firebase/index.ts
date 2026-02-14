
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * تهيئة الفايربيز مع مراعاة بيئات البناء المختلفة (Vercel vs Firebase App Hosting).
 */
export function initializeFirebase() {
  if (getApps().length > 0) return getSdks(getApp());

  let firebaseApp;
  
  // التحقق مما إذا كنا في بيئة استضافة الفايربيز الرسمية لتجنب رسائل الخطأ في Vercel
  const isFirebaseHosting = typeof window !== 'undefined' && 
    (window.location.hostname.includes('firebaseapp.com') || window.location.hostname.includes('web.app'));

  if (isFirebaseHosting && process.env.NODE_ENV === 'production') {
    try {
      // المحاولة فقط إذا كان الاحتمال كبيراً للنجاح (استضافة فايربيز)
      firebaseApp = initializeApp();
    } catch (e) {
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    // في Vercel أو التطوير المحلي، نستخدم الإعدادات مباشرة
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
