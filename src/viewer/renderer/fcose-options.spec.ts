import { describe, expect, it } from 'vitest';
import { fcoseOptions } from './fcose-options.js';

describe('fcoseOptions', () => {
  it('scales repulsion quadratically with spacingFactor', () => {
    const a = fcoseOptions(1, true);
    const b = fcoseOptions(2, true);
    expect(b.nodeRepulsion).toBe(a.nodeRepulsion * 4);
    expect(b.idealEdgeLength).toBe(a.idealEdgeLength * 2);
  });

  it('clamps very small spacing values', () => {
    const opt = fcoseOptions(0, false);
    expect(opt.nodeRepulsion).toBeGreaterThan(0);
    expect(opt.idealEdgeLength).toBeGreaterThan(0);
    expect(opt.randomize).toBe(false);
  });

  it('passes randomize flag through', () => {
    expect(fcoseOptions(1, true).randomize).toBe(true);
    expect(fcoseOptions(1, false).randomize).toBe(false);
  });
});
