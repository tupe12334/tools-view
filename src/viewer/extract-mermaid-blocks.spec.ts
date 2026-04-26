import { describe, it, expect } from 'vitest';
import { extractMermaidBlocks } from './extract-mermaid-blocks.js';

describe('extractMermaidBlocks', () => {
  it('returns empty list when none found', () => {
    expect(extractMermaidBlocks('no diagrams here')).toEqual([]);
  });

  it('extracts a single block', () => {
    const body = 'intro\n```mermaid\ngraph TD\nA-->B\n```\nafter';
    expect(extractMermaidBlocks(body)).toEqual(['graph TD\nA-->B']);
  });

  it('extracts multiple blocks and ignores non-mermaid fences', () => {
    const body = '```js\nconst x = 1\n```\n```mermaid\nA\n```\nmid\n```mermaid\nB\n```';
    expect(extractMermaidBlocks(body)).toEqual(['A', 'B']);
  });
});
