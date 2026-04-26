import { describe, expect, it } from 'vitest';
import { dagreOptions } from './dagre-options.js';

describe('dagreOptions', () => {
  it('scales node and rank separation linearly', () => {
    const a = dagreOptions(1);
    const b = dagreOptions(2);
    expect(b.nodeSep).toBe(a.nodeSep * 2);
    expect(b.rankSep).toBe(a.rankSep * 2);
  });

  it('clamps spacing floor and uses top-down rankDir', () => {
    const opt = dagreOptions(0);
    expect(opt.nodeSep).toBeGreaterThan(0);
    expect(opt.rankSep).toBeGreaterThan(0);
    expect(opt.rankDir).toBe('TB');
  });
});
