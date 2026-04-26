import type { Vec2 } from './vec2.js';

export function screenToWorld(x: number, y: number, pan: Vec2, scale: number): Vec2 {
  return { x: (x - pan.x) / scale, y: (y - pan.y) / scale };
}
