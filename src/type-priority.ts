import type { EdgeType } from './edge-type.js';

export const TYPE_PRIORITY: Record<EdgeType, number> = {
  prerequisite: 3,
  calls: 2,
  suggests: 1,
  references: 0,
};
