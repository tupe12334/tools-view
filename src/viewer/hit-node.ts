import type { SimNode } from './sim-node.js';

export function hitNode(wx: number, wy: number, nodes: SimNode[]): SimNode | undefined {
  return nodes.find((n) => Math.abs(wx - n.x) < n.w / 2 && Math.abs(wy - n.y) < n.h / 2);
}
