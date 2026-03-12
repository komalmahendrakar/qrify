'use client';

import { firebaseConfig } from '@/firebase/config';

/**
 * Utility to get the base URL for the application.
 * Dynamically detects the current origin but falls back to a public domain
 * during development to ensure QR codes are scannable on external devices.
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    // Check if we are running on a production-like domain (not a dev workstation)
    const isDevWorkstation = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('cloudshell.dev') || 
      origin.includes('googleusercontent.com') ||
      origin.includes('gitpod.io');

    if (!isDevWorkstation) {
      return origin;
    }
  }

  // Fallback for cloud workstations or local dev.
  // This allows you to scan QR codes on your phone that point to a live
  // (though perhaps empty) Firebase Hosting domain for testing redirect logic.
  // If you are using Vercel, you can also hardcode your vercel domain here.
  return `https://${firebaseConfig.projectId}.web.app`;
}
