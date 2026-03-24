
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('WARNING: Supabase credentials missing. The application will use placeholder values and may not function correctly.');
}

// Initialize with placeholder if missing to avoid immediate crash at module load
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
