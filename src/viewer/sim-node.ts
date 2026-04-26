import type { SkillNode } from '../skill-node.js';

export interface SimNode extends SkillNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
}
