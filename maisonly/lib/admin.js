// Serveur uniquement (routes /api). Contourne la RLS : ne jamais importer côté client.
import { createClient } from '@supabase/supabase-js';
export const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
export const PRIX = 25000;
const live = process.env.PAYDUNYA_MODE === 'live';
export const PD_BASE = live ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1';
export const pdHeaders = () => ({
  'Content-Type': 'application/json',
  'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
  'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN,
});
