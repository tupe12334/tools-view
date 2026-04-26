import type { NodeType } from './node-type.js';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  type: NodeType;
  filePath: string;
  body?: string;
}
