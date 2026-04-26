import type { SkillEdge } from './skill-edge.js';
import type { SkillNode } from './skill-node.js';

export interface Graph {
  generated: string;
  skillsDir: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
}
