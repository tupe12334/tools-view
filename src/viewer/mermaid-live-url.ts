import { toUrlSafeBase64 } from './to-url-safe-base64.js';

// eslint-disable-next-line default/no-hardcoded-urls
const MERMAID_LIVE_EDIT = 'https://mermaid.live/edit#base64:';

export function mermaidLiveUrl(code: string): string {
  const state = {
    code,
    mermaid: '{"theme":"default"}',
    autoSync: true,
    updateDiagram: true,
  };
  return MERMAID_LIVE_EDIT + toUrlSafeBase64(JSON.stringify(state));
}
