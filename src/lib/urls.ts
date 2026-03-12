'use client';

/**
 * Utility to get the base URL for the application.
 * Returns the custom domain in production, or the current window origin in development.
 */
export function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  
  // Use the requested custom domain for production
  if (process.env.NODE_ENV === 'production') {
    return 'https://qr.yourdomain.com';
  }
  
  // Fallback to current origin for local development (e.g., localhost:9002)
  return window.location.origin;
}
