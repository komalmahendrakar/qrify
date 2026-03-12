import { createClient } from '@supabase/supabase-js';

/**
 * Server-side QR Code storage using Supabase.
 * Swapped from JSON file storage to support persistent storage on Vercel.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with Service Role Key for server-side bypassing of RLS
const supabase = createClient(supabaseUrl, supabaseKey);

export interface QRCode {
  id: string;
  originalUrl: string;
  qrCodeImageUrl: string;
  title: string;
  createdAt: string; // ISO 8601
  status: 'active' | 'inactive';
  totalScans: number;
  lastScannedAt?: string | null;
}

/** Save a new QR code record. */
export async function saveQRCode(qr: QRCode): Promise<void> {
  const { error } = await supabase
    .from('qr_codes')
    .insert([qr]);
  
  if (error) {
    console.error('[SUPABASE_SAVE_ERROR]', error);
    throw new Error('Failed to save QR code to database.');
  }
}

/** Get all QR codes, sorted newest first. */
export async function getAllQRCodes(): Promise<QRCode[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[SUPABASE_FETCH_ERROR]', error);
    return [];
  }
  return data as QRCode[];
}

/** Get a single QR code by its ID. */
export async function getQRCodeById(id: string): Promise<QRCode | undefined> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found error code
        console.error('[SUPABASE_GET_ERROR]', error);
    }
    return undefined;
  }
  return data as QRCode;
}

/** Delete a QR code by ID. Returns true if found and deleted. */
export async function deleteQRCode(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SUPABASE_DELETE_ERROR]', error);
    return false;
  }
  return true;
}

/** Update a QR code by ID with partial data. */
export async function updateQRCode(id: string, updates: Partial<Omit<QRCode, 'id'>>): Promise<boolean> {
  const { error } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[SUPABASE_UPDATE_ERROR]', error);
    return false;
  }
  return true;
}

/** Increment the scan count for a QR code. */
export async function incrementScanCount(id: string): Promise<boolean> {
  // Use a rpc call or a select-then-update for simplicity in a server-side only context
  const current = await getQRCodeById(id);
  if (!current) return false;

  const { error } = await supabase
    .from('qr_codes')
    .update({ 
      totalScans: (current.totalScans || 0) + 1,
      lastScannedAt: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('[SUPABASE_INCREMENT_ERROR]', error);
    return false;
  }
  return true;
}
