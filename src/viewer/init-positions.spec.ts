import { describe, it, expect } from 'vitest';
import { initPositions } from './init-positions.js';
import type { SimNode } from './sim-node.js';

function makeNode(id: string): SimNode {
  return {
    id,
    name: id,
    description: '',
    allowedTools: [],
    type: 'skill',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 0,
    h: 0,
  };
}

describe('initPositions', () => {
  it('places nodes on a circle around the center', () => {
    const nodes = [makeNode('a'), makeNode('b'), makeNode('c'), makeNode('d')];
    initPositions(nodes, 1000, 800);
    const cx = 500;
    const cy = 400;
    const r = Math.min(1000, 800) * 0.32;
    nodes.forEach((n) => {
      const dx = n.x - cx;
      const dy = n.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(r, 5);
    });
    expect(nodes[0].x).toBeCloseTo(cx + r, 5);
    expect(nodes[0].y).toBeCloseTo(cy, 5);
  });
});
