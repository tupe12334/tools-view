import type { PhysicsState } from './physics-state.js';

export function tick(state: PhysicsState): void {
  const { nodes, nodeById, edges, drag, spacingFactor, W, H } = state;
  const k = 200 * spacingFactor;
  const repulsion = 8000 * spacingFactor * spacingFactor;
  const damping = 0.82;
  const dt = 0.6;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = repulsion / (dist * dist);
      const fx = (f * dx) / dist;
      const fy = (f * dy) / dist;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  edges.forEach((e) => {
    const a = nodeById.get(e.from);
    const b = nodeById.get(e.to);
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const f = (dist - k) * 0.04;
    const fx = (f * dx) / dist;
    const fy = (f * dy) / dist;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  });

  nodes.forEach((n) => {
    n.vx += (W / 2 - n.x) * 0.002;
    n.vy += (H / 2 - n.y) * 0.002;
  });

  nodes.forEach((n) => {
    if (n === drag) return;
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
  });
}
