import { createClient } from '@supabase/supabase-js';

// These environment variables must be provided in the project configuration
// Fallback to provided credentials if env vars are missing
export const supabaseUrl = process.env.SUPABASE_URL || 'https://wkwqxlirhzaeocpzakov.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrd3F4bGlyaHphZW9jcHpha292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDk2NjEsImV4cCI6MjA4MDkyNTY2MX0.kRTcwp0PsmgbPHnSHPkBgmNfp4xNmpaOiWTBxH6dui0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);