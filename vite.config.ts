import { defineConfig } from 'vite';

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
});
