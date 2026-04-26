import type { SkillNode } from '../../skill-node.js';

export interface NodeEvent {
  node: SkillNode;
  clientX: number;
  clientY: number;
}
