import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@smart-games/common-spa': path.resolve(__dirname, './shared/common-spa/src/index.ts'),
    },
  },
});
