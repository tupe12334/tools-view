import type { EdgeType } from './edge-type.js';
import type { SkillEdge } from './skill-edge.js';
import { TYPE_PRIORITY } from './type-priority.js';
import { classifyRef } from './classify-ref.js';
import { extractSkillCallEdges } from './skill-call/extract-skill-call-edges.js';

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

  for (const edge of extractSkillCallEdges(fromId, body, allSkillIds)) {
    const priority = TYPE_PRIORITY.calls;
    const existing = best.get(edge.to);
    if (existing === undefined || priority > existing.priority) {
      best.set(edge.to, { type: 'calls', priority });
    }
  }

  return [...best.entries()].map(([to, { type }]) => ({ from: fromId, to, type }));
}
