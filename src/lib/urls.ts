'use client';

import { firebaseConfig } from '@/firebase/config';

/**
 * Utility to get the base URL for the application.
 * Returns the public Firebase Hosting domain for the project.
 * This ensures generated QR codes and share links always use a publicly 
 * accessible URL (https://PROJECT_ID.web.app) instead of workstation-specific 
 * or internal development workstation URLs.
 */
export function getBaseUrl() {
  // Construct the standard Firebase Hosting domain using the Project ID from config.
  // This allows QR codes to be scanned and tested by external devices (like phones)
  // even while the developer is working within a cloud workstation or local environment.
  return `https://${firebaseConfig.projectId}.web.app`;
}
