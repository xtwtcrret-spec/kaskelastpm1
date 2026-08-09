import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum di-set. Data kas TIDAK akan tersimpan bersama (shared). ' +
    'Cek file .env.local dan environment variables di Render.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Semua data kas kelas disimpan dalam SATU baris (id = 1) di tabel `kas_data`,
// sebagai JSON, supaya semua device/browser baca & tulis ke sumber yang sama.
export const KAS_ROW_ID = 1;

export interface KasDataRow {
  id: number;
  settings: any;
  members: any[];
  transactions: any[];
  budgets: any[];
  updated_at: string;
}
