import { defineConfig } from 'vitest/config';

const NODE_BUILTINS = ['fs', 'path', 'child_process', 'os', 'url', 'util', 'stream', 'events', 'assert'];

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: (id) =>
        id.startsWith('node:') || NODE_BUILTINS.includes(id),
      output: {
        banner: '#!/usr/bin/env node',
      },
    },
    target: 'node18',
    minify: false,
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
