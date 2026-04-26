import fsSync from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { build as esbuildBuild } from 'esbuild';

const NODE_BUILTINS = ['fs', 'path', 'child_process', 'os', 'url', 'util', 'stream', 'events', 'assert'];

const VIEWER_PLACEHOLDER = '/*__VIEWER_BUNDLE__*/';

async function bundleViewer(repoRoot: string): Promise<string> {
  const result = await esbuildBuild({
    entryPoints: [path.join(repoRoot, 'src/viewer/main.ts')],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
    target: 'es2020',
    platform: 'browser',
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

export default defineConfig({
  plugins: [
    {
      name: 'inline-viewer-bundle',
      enforce: 'pre',
      async load(id: string) {
        const [filepath, query] = id.split('?');
        if (!filepath.endsWith('template.html') || query !== 'raw') return null;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const html = fsSync.readFileSync(filepath, 'utf-8');
        if (!html.includes(VIEWER_PLACEHOLDER)) return `export default ${JSON.stringify(html)}`;
        const repoRoot = path.dirname(path.dirname(filepath));
        const viewerCode = await bundleViewer(repoRoot);
        const out = html.replace(VIEWER_PLACEHOLDER, () => viewerCode);
        return `export default ${JSON.stringify(out)}`;
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
      exclude: [
        'src/index.ts',
        'src/lib.ts',
        'src/viewer/main.ts',
        'src/viewer/renderer/cytoscape-renderer.ts',
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
