import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const options = {
  auth: {
    persistSession: true,
    storageKey: 'sb-session',
    storage: window.localStorage, // Changed to localStorage for persistent sessions
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'eduVerse-webapp',
    },
  },
};

export const supabase = createClient(
  environment.supabase.url,
  environment.supabase.anonKey,
  options
);