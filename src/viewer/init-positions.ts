import type { SimNode } from './sim-node.js';

export function initPositions(nodes: SimNode[], W: number, H: number): void {
  const r = Math.min(W, H) * 0.32;
  nodes.forEach((n, i) => {
    const a = (2 * Math.PI * i) / nodes.length;
    n.x = W / 2 + r * Math.cos(a);
    n.y = H / 2 + r * Math.sin(a);
  });
}
