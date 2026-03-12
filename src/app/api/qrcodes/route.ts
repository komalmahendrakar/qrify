import { NextResponse } from 'next/server';
import { getAllQRCodes } from '@/lib/storage';

/**
 * GET /api/qrcodes
 * Returns all QR codes as JSON for the dashboard and admin pages.
 */
export async function GET() {
  try {
    const qrcodes = await getAllQRCodes();
    return NextResponse.json(qrcodes);
  } catch (error) {
    console.error('[API_ERROR] Failed to fetch QR codes:', error);
    return NextResponse.json([], { status: 500 });
  }
}
