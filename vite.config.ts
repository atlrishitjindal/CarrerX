import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Log warning if API key is missing during build (helpful for Vercel logs)
  if (!env.API_KEY) {
    console.warn("⚠️  WARNING: API_KEY is not defined in the environment variables. AI features will likely fail in production.");
  }

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the app usage
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
    },
  };
});