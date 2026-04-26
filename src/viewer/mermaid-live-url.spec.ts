import { describe, it, expect } from 'vitest';
import { mermaidLiveUrl } from './mermaid-live-url.js';

describe('mermaidLiveUrl', () => {
  it('builds a base64 mermaid.live URL containing the code', () => {
    const url = mermaidLiveUrl('graph TD\nA-->B');
    expect(url.startsWith('https://mermaid.live/edit#base64:')).toBe(true);
    const encoded = url.split('#base64:')[1];
    const json = Buffer.from(
      encoded.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    const state: { code: string; autoSync: boolean; updateDiagram: boolean } = JSON.parse(json);
    expect(state.code).toBe('graph TD\nA-->B');
    expect(state.autoSync).toBe(true);
    expect(state.updateDiagram).toBe(true);
  });
});
