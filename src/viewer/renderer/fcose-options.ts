import type { FcoseOptions } from './fcose-options-type.js';

export function fcoseOptions(spacingFactor: number, randomize: boolean): FcoseOptions {
  const sf = Math.max(0.1, spacingFactor);
  return {
    name: 'fcose',
    quality: 'default',
    animate: false,
    randomize,
    nodeRepulsion: 8000 * sf * sf,
    idealEdgeLength: 120 * sf,
    gravity: 0.25,
    numIter: 2500,
  };
}
