import { describe, it, expect } from 'vitest';
import { toUrlSafeBase64 } from './to-url-safe-base64.js';

function decode(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

describe('toUrlSafeBase64', () => {
  it('produces output without + or / characters', () => {
    const out = toUrlSafeBase64('hello??>>');
    expect(out).not.toMatch(/[+/]/);
    expect(decode(out)).toBe('hello??>>');
  });

  it('round-trips unicode strings', () => {
    const out = toUrlSafeBase64('héllo 🌍');
    expect(decode(out)).toBe('héllo 🌍');
  });
});
