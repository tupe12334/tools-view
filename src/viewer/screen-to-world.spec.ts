import { describe, it, expect } from 'vitest';
import { screenToWorld } from './screen-to-world.js';

describe('screenToWorld', () => {
  it('inverts pan and scale', () => {
    expect(screenToWorld(110, 220, { x: 10, y: 20 }, 2)).toEqual({ x: 50, y: 100 });
  });

  it('is identity for no pan and scale 1', () => {
    expect(screenToWorld(7, 9, { x: 0, y: 0 }, 1)).toEqual({ x: 7, y: 9 });
  });
});
