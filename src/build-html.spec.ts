import { describe, expect, it } from 'vitest';
import { buildHtml } from './build-html.js';

describe('buildHtml', () => {
  it('replaces graph data placeholder with JSON', () => {
    const graph = {
      generated: '2024-01-01T00:00:00.000Z',
      skillsDir: 'skills',
      agentsDir: null,
      nodes: [],
      edges: [],
    };
    const html = buildHtml(graph);
    expect(html).toContain(JSON.stringify(graph));
    expect(html).not.toContain('__GRAPH_DATA_PLACEHOLDER__');
  });

  it('escapes </ in node body to prevent script tag breakout', () => {
    const graph = {
      generated: '',
      skillsDir: null,
      agentsDir: null,
      nodes: [
        {
          id: 'a',
          name: 'A',
          description: '',
          allowedTools: [],
          type: 'skill' as const,
          body: 'oops </script> should not break',
        },
      ],
      edges: [],
    };
    const html = buildHtml(graph);
    expect(html).not.toContain('</script> should not break');
    expect(html).toContain('<\\/script>');
  });

  it('returns string containing template content', () => {
    const graph = { generated: '', skillsDir: null, agentsDir: null, nodes: [], edges: [] };
    const html = buildHtml(graph);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });
});
