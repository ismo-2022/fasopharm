
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials missing. The application will not function correctly.');
}

// Initialize with empty strings if missing to avoid immediate crash at module load,
// but it will still fail on first request.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
