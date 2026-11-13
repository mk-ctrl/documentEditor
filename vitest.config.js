import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js'],
    // Load .env (all keys, not just VITE_) so tests that need the real database can use it.
    env: loadEnv(mode, process.cwd(), ''),
  },
}));
