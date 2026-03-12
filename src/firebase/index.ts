'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Initializes Firebase with explicit configuration for Vercel/External environments.
 * Prioritizes environment variables, then falls back to the static config object.
 */
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (firebaseConfig as any).storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
  };

  let firebaseApp: FirebaseApp;
  try {
    // We explicitly provide the config object because Vercel does not support 
    // the auto-discovery mechanism used by Firebase App Hosting.
    firebaseApp = initializeApp(config);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
    // Final fallback to the existing app if initialization failed but app exists
    firebaseApp = getApp();
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
