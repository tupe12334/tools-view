import { describe, expect, it } from 'vitest';
import { autoSpacing } from './auto-spacing.js';

describe('autoSpacing', () => {
  it('returns 1 for small sparse graphs', () => {
    expect(autoSpacing(5, 4)).toBe(1);
    expect(autoSpacing(0, 0)).toBe(1);
  });

  it('grows with node count', () => {
    const small = autoSpacing(10, 10);
    const large = autoSpacing(50, 50);
    expect(large).toBeGreaterThan(small);
  });

  it('grows with edge density at fixed node count', () => {
    const sparse = autoSpacing(30, 30);
    const dense = autoSpacing(30, 600);
    expect(dense).toBeGreaterThan(sparse);
  });

  it('produces a meaningful factor for very dense graphs (gstack-like)', () => {
    const f = autoSpacing(46, 1294);
    expect(f).toBeGreaterThan(2.5);
  });
});
