import type { EdgeType } from './edge-type.js';
import type { SkillEdge } from './skill-edge.js';
import { TYPE_PRIORITY } from './type-priority.js';
import { classifyRef } from './classify-ref.js';

export function extractEdges(fromId: string, body: string, allSkillIds: string[]): SkillEdge[] {
  const best = new Map<string, { type: EdgeType; priority: number }>();

  for (const targetId of allSkillIds) {
    if (targetId === fromId) continue;

    const pattern = new RegExp(`/${targetId}(?=[^a-z0-9-]|$)`, 'gi');
    let m = pattern.exec(body);
    while (m !== null) {
      const before = body.slice(Math.max(0, m.index - 120), m.index);
      const type = classifyRef(before);
      const priority = TYPE_PRIORITY[type];
      const existing = best.get(targetId);
      if (existing === undefined || priority > existing.priority) {
        best.set(targetId, { type, priority });
      }
      m = pattern.exec(body);
    }
  }

  return [...best.entries()].map(([to, { type }]) => ({ from: fromId, to, type }));
}
