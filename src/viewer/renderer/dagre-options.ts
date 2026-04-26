import type { DagreOptions } from './dagre-options-type.js';

export function dagreOptions(spacingFactor: number): DagreOptions {
  const sf = Math.max(0.1, spacingFactor);
  return {
    name: 'dagre',
    rankDir: 'TB',
    animate: false,
    nodeSep: 40 * sf,
    rankSep: 80 * sf,
  };
}
