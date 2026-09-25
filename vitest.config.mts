import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // next-auth's ESM files import subpaths of `next` (e.g. next/server) without an extension; Node's own
  // ESM resolver can't find them, so bundle next-auth through Vite's resolver instead of externalizing it.
  ssr: { noExternal: ['next-auth'] },
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'evals/**/*.test.ts'],
          exclude: ['**/*.int.test.ts', 'node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.int.test.ts'],
          testTimeout: 20_000,
        },
      },
    ],
  },
});
