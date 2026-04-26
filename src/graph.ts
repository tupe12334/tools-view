import type { GitInfo } from './git-info-type.js';
import type { Maybe } from './maybe.js';
import type { SkillEdge } from './skill-edge.js';
import type { SkillNode } from './skill-node.js';

export interface Graph {
  generated: string;
  skillsDir: Maybe<string>;
  agentsDir: Maybe<string>;
  git: Maybe<GitInfo>;
  nodes: SkillNode[];
  edges: SkillEdge[];
}
