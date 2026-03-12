'use client';

/**
 * Returns the base URL for the current deployment.
 * Works on any hosting platform — Vercel, VPS, localhost.
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:9002';
}