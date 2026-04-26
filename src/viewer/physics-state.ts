import type { SkillEdge } from '../skill-edge.js';
import type { SimNode } from './sim-node.js';

export interface PhysicsState {
  nodes: SimNode[];
  nodeById: Map<string, SimNode>;
  edges: SkillEdge[];
  drag: SimNode | null;
  spacingFactor: number;
  W: number;
  H: number;
}
