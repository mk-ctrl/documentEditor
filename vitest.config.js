import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    // Integration tests make many real round trips to Supabase (auth check + queries per request).
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['server/**/*.test.js'],
    // Load .env (all keys, not just VITE_) so tests that need the real database can use it.
    env: loadEnv(mode, process.cwd(), ''),
  },
}));
