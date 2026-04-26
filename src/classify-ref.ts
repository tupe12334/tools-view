import type { EdgeType } from './edge-type.js';

export function classifyRef(contextBefore: string): EdgeType {
  const c = contextBefore.toLowerCase();

  if (
    c.includes('prerequisite') ||
    (c.includes('run') && c.includes('before')) ||
    c.includes('require') ||
    c.includes('must have') ||
    c.includes('ensure') ||
    c.includes('active session')
  )
    return 'prerequisite';

  if (
    c.includes('full logic in') ||
    c.includes('apply those instructions') ||
    c.includes('calls') ||
    c.includes('using') ||
    c.includes('invokes') ||
    (c.includes('step') && c.includes('run'))
  )
    return 'calls';

  if (
    c.includes('suggest') ||
    c.includes('next step') ||
    c.includes('next:') ||
    c.includes('then run') ||
    (c.includes('guide') && c.includes('run'))
  )
    return 'suggests';

  return 'references';
}
