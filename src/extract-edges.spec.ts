import { describe, expect, it } from 'vitest';
import { extractEdges } from './extract-edges.js';

describe('extractEdges', () => {
  it('returns empty for no matches', () => {
    expect(extractEdges('a', 'no skill refs here', ['b', 'c'])).toEqual([]);
  });

  it('skips self-reference', () => {
    expect(extractEdges('a', 'use /a here', ['a'])).toEqual([]);
  });

  it('extracts a references edge', () => {
    const edges = extractEdges('a', 'see /b for details', ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'a', to: 'b', type: 'references' });
  });

  it('extracts prerequisite edge', () => {
    const edges = extractEdges('a', 'prerequisite: use /b', ['a', 'b']);
    expect(edges[0].type).toBe('prerequisite');
  });

  it('extracts calls edge', () => {
    const edges = extractEdges('a', 'calls /b for processing', ['a', 'b']);
    expect(edges[0].type).toBe('calls');
  });

  it('extracts suggests edge', () => {
    const edges = extractEdges('a', 'suggest running /b next', ['a', 'b']);
    expect(edges[0].type).toBe('suggests');
  });

  it('keeps highest priority across multiple matches of same target', () => {
    const body = 'see /b ... calls /b';
    const edges = extractEdges('a', body, ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('calls');
  });

  it('does not upgrade when lower priority found after higher', () => {
    const body = 'prerequisite: /b ... see also /b';
    const edges = extractEdges('a', body, ['a', 'b']);
    expect(edges[0].type).toBe('prerequisite');
  });

  it('does not match partial skill ids', () => {
    expect(extractEdges('a', 'see /bc for details', ['a', 'b'])).toHaveLength(0);
  });

  it('matches skill id at end of string', () => {
    const edges = extractEdges('a', 'see /b', ['a', 'b']);
    expect(edges).toHaveLength(1);
  });

  it('uses full 120-char context window for classification', () => {
    const padding = 'x'.repeat(150);
    const body = `prerequisite ${padding}/b`;
    const edges = extractEdges('a', body, ['a', 'b']);
    expect(edges[0].type).toBe('references');
  });

  it('extracts edges for multiple targets', () => {
    const edges = extractEdges('a', 'see /b and /c here', ['a', 'b', 'c']);
    expect(edges).toHaveLength(2);
  });
});
