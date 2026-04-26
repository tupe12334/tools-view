import fsSync from 'node:fs';
import { defineConfig } from 'vitest/config';
import { transformWithEsbuild } from 'vite';

const NODE_BUILTINS = ['fs', 'path', 'child_process', 'os', 'url', 'util', 'stream', 'events', 'assert'];

export default defineConfig({
  plugins: [
    {
      name: 'minify-template-script',
      enforce: 'pre',
      async load(id: string) {
        const [filepath, query] = id.split('?');
        if (!filepath.endsWith('template.html') || query !== 'raw') return null;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = fsSync.readFileSync(filepath, 'utf-8');
        const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(content);
        if (!scriptMatch) return `export default ${JSON.stringify(content)}`;
        const { code: min } = await transformWithEsbuild(scriptMatch[1].trim(), 'script.js', { minify: true, format: 'iife' });
        const processed = content.replace(scriptMatch[0], `<script>${min}</script>`);
        return `export default ${JSON.stringify(processed)}`;
      },
    },
  ],
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
    minify: true,
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/lib.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
