import { describe, expect, it } from 'vitest';
import { buildHtml } from './build-html.js';

describe('buildHtml', () => {
  it('replaces __GRAPH_DATA__ with JSON', () => {
    const graph = {
      generated: '2024-01-01T00:00:00.000Z',
      skillsDir: 'skills',
      nodes: [],
      edges: [],
    };
    const html = buildHtml(graph);
    expect(html).toContain(JSON.stringify(graph));
    expect(html).not.toContain('__GRAPH_DATA__');
  });

  it('returns string containing template content', () => {
    const graph = { generated: '', skillsDir: '', nodes: [], edges: [] };
    const html = buildHtml(graph);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });
});
