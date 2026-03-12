'use client';

/**
 * @fileOverview Domain Logic.
 * This ensures QR codes work regardless of where the app is deployed.
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    // Detect if we are on Vercel or a custom production domain
    const isProduction = 
      !origin.includes('localhost') && 
      !origin.includes('127.0.0.1') && 
      !origin.includes('cloudshell.dev') &&
      !origin.includes('gitpod.io');

    if (isProduction) return origin;
  }

  // Stable mobile-scannable fallback for dev
  return `https://qr.yourdomain.com`;
}