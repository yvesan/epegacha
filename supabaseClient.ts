import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These keys should be in your .env file locally or Vercel environment variables.
// For the user (Beginner): I will explain how to set this up in the guide.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// We export a client, but it might be null if not configured.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;