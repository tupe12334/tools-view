import type { SkillEdge } from '../skill-edge.js';

export function extractSkillCallEdges(fromId: string, body: string, allSkillIds: string[]): SkillEdge[] {
  const edges: SkillEdge[] = [];
  const pattern = /\bskill\s*=\s*['"]([^'"]+)['"]/gi;
  let m = pattern.exec(body);
  while (m !== null) {
    const targetId = m[1];
    if (targetId !== fromId && allSkillIds.includes(targetId)) {
      edges.push({ from: fromId, to: targetId, type: 'calls' });
    }
    m = pattern.exec(body);
  }
  return edges;
}
