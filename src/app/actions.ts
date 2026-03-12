'use server';

import { saveQRCode, deleteQRCode, updateQRCode, type QRCode } from '@/lib/storage';
import QRCodeLib from 'qrcode';

/**
 * Server Action: Generate a QR code image and save the record.
 */
export async function generateAndSaveQRCode(input: {
  originalUrl: string;
  title: string;
  baseUrl: string;
}): Promise<{ success: boolean; qrCode?: QRCode; error?: string }> {
  try {
    const { originalUrl, title, baseUrl } = input;

    // Validate URL
    try {
      const parsed = new URL(originalUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { success: false, error: 'URL must start with http:// or https://' };
      }
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    // Generate unique ID
    const id = crypto.randomUUID().split('-')[0] + Date.now().toString(36);

    // The QR code encodes the dynamic redirect URL
    const redirectUrl = `${baseUrl}/r/${id}`;

    // Generate QR code image as base64 data URI
    const qrCodeImageUrl = await QRCodeLib.toDataURL(redirectUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    const qrCode: QRCode = {
      id,
      originalUrl,
      qrCodeImageUrl,
      title: title || `Link to ${new URL(originalUrl).hostname.replace('www.', '')}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      totalScans: 0,
    };

    await saveQRCode(qrCode);

    return { success: true, qrCode };
  } catch (error: any) {
    console.error('[SAVE_ERROR]', error);
    return { success: false, error: error?.message || 'Failed to generate QR code.' };
  }
}

/**
 * Server Action: Delete a QR code by ID.
 */
export async function deleteQRCodeAction(id: string): Promise<{ success: boolean }> {
  const deleted = await deleteQRCode(id);
  return { success: deleted };
}

/**
 * Server Action: Toggle a QR code's status between active and inactive.
 */
export async function toggleQRCodeStatusAction(
  id: string,
  newStatus: 'active' | 'inactive'
): Promise<{ success: boolean }> {
  const updated = await updateQRCode(id, { status: newStatus });
  return { success: updated };
}
