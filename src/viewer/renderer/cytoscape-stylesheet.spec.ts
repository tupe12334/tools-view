import { describe, expect, it } from 'vitest';
import { cytoscapeStylesheet } from './cytoscape-stylesheet.js';
import type { RendererTheme } from './renderer-theme.js';

const theme: RendererTheme = {
  nodeFill: { skill: '#111', agent: '#222' },
  nodeBorder: { skill: '#aaa', agent: '#bbb' },
  nodeFillActive: { skill: '#333', agent: '#444' },
  nodeBorderActive: { skill: '#ccc', agent: '#ddd' },
  edgeColor: {
    prerequisite: '#f00',
    calls: '#0f0',
    suggests: '#00f',
    references: '#888',
  },
  edgeDashed: {
    prerequisite: false,
    calls: false,
    suggests: false,
    references: true,
  },
};

describe('cytoscapeStylesheet', () => {
  it('emits per-type node fill rules using theme colors', () => {
    const rules = cytoscapeStylesheet(theme);
    const skill = rules.find((r) => r.selector === 'node[type="skill"]');
    expect(skill?.style['background-color']).toBe('#111');
    expect(skill?.style['border-color']).toBe('#aaa');
    const agent = rules.find((r) => r.selector === 'node[type="agent"]');
    expect(agent?.style['background-color']).toBe('#222');
    expect(agent?.style['border-color']).toBe('#bbb');
  });

  it('emits active-state node rules', () => {
    const rules = cytoscapeStylesheet(theme);
    const active = rules.find((r) => r.selector === 'node[type="skill"].active');
    expect(active?.style['background-color']).toBe('#333');
    expect(active?.style['border-color']).toBe('#ccc');
  });

  it('marks references edges as dashed and others as solid', () => {
    const rules = cytoscapeStylesheet(theme);
    const ref = rules.find((r) => r.selector === 'edge[type="references"]');
    const calls = rules.find((r) => r.selector === 'edge[type="calls"]');
    expect(ref?.style['line-style']).toBe('dashed');
    expect(calls?.style['line-style']).toBe('solid');
    expect(ref?.style['line-color']).toBe('#888');
    expect(calls?.style['line-color']).toBe('#0f0');
  });

  it('declares base node and edge rules', () => {
    const rules = cytoscapeStylesheet(theme);
    expect(rules.find((r) => r.selector === 'node')?.style.label).toBe('data(name)');
    expect(rules.find((r) => r.selector === 'edge')?.style.label).toBe('data(type)');
  });
});
