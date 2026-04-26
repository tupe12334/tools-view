import type { EdgeType } from './edge-type.js';

export interface SkillEdge {
  from: string;
  to: string;
  type: EdgeType;
}
