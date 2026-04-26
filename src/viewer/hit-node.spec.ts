import { describe, it, expect } from 'vitest';
import { hitNode } from './hit-node.js';
import type { SimNode } from './sim-node.js';

function n(id: string, x: number, y: number, w = 40, h = 30): SimNode {
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
    w,
    h,
  };
}

describe('hitNode', () => {
  it('returns the node containing the world coordinate', () => {
    const nodes = [n('a', 100, 100), n('b', 200, 100)];
    expect(hitNode(105, 100, nodes)?.id).toBe('a');
    expect(hitNode(195, 100, nodes)?.id).toBe('b');
  });

  it('returns undefined when nothing matches', () => {
    expect(hitNode(0, 0, [n('a', 500, 500)])).toBeUndefined();
  });
});
