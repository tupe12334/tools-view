import { defineConfig } from 'vitest/config';
import { transformWithEsbuild } from 'vite';
import fsSync from 'node:fs';

const NODE_BUILTINS = ['fs', 'path', 'child_process', 'os', 'url', 'util', 'stream', 'events', 'assert'];

export default defineConfig({
  plugins: [
    {
      name: 'minify-template-script',
      enforce: 'pre',
      async load(id: string) {
        const [filepath, query] = id.split('?');
        if (!filepath.endsWith('template.html') || query !== 'raw') return null;
        const content = fsSync.readFileSync(filepath, 'utf-8');
        const match = content.match(/<script>([\s\S]*?)<\/script>/);
        if (!match) return `export default ${JSON.stringify(content)}`;
        const { code: min } = await transformWithEsbuild(match[1].trim(), 'script.js', { minify: true, format: 'iife' });
        const processed = content.replace(match[0], `<script>${min}</script>`);
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
      include: [
        'src/build-html.ts',
        'src/classify-ref.ts',
        'src/extract-edges.ts',
        'src/find-skills-dir.ts',
        'src/main.ts',
        'src/open-browser.ts',
        'src/parse-frontmatter.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
