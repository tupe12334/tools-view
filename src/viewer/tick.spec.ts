import { describe, it, expect } from 'vitest';
import type { SkillEdge } from '../skill-edge.js';
import type { SimNode } from './sim-node.js';
import { tick } from './tick.js';

function n(id: string, x: number, y: number): SimNode {
  return {
    id,
    name: id,
    description: '',
    allowedTools: [],
    type: 'skill',
    x,
    y,
    vx: 0,
    vy: 0,
    w: 40,
    h: 30,
  };
}

function stateOf(nodes: SimNode[], edges: SkillEdge[], drag: SimNode | null = null) {
  return {
    nodes,
    edges,
    nodeById: new Map(nodes.map((node) => [node.id, node])),
    drag,
    spacingFactor: 1,
    W: 1000,
    H: 800,
  };
}

describe('tick', () => {
  it('repels nearby nodes apart along x axis', () => {
    const a = n('a', 495, 400);
    const b = n('b', 505, 400);
    tick(stateOf([a, b], []));
    expect(a.x).toBeLessThan(495);
    expect(b.x).toBeGreaterThan(505);
  });

  it('skips position update for the dragged node but still applies forces to others', () => {
    const a = n('a', 495, 400);
    const b = n('b', 505, 400);
    tick(stateOf([a, b], [], a));
    expect(a.x).toBe(495);
    expect(a.y).toBe(400);
    expect(b.x).not.toBe(505);
  });

  it('pulls connected nodes closer via spring force', () => {
    const a = n('a', 100, 400);
    const b = n('b', 900, 400);
    const before = b.x - a.x;
    tick(stateOf([a, b], [{ from: 'a', to: 'b', type: 'calls' }]));
    const after = b.x - a.x;
    expect(after).toBeLessThan(before);
  });

  it('ignores edges referencing missing nodes', () => {
    const a = n('a', 495, 400);
    expect(() => {
      tick(stateOf([a], [{ from: 'a', to: 'missing', type: 'calls' }]));
    }).not.toThrow();
  });
});
