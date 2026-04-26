import type { GitInfo } from '../git-info-type.js';

export function githubIdeUrl(git: GitInfo, filePath: string): string {
  const path = filePath.split('/').map(encodeURIComponent).join('/');
  return (
    'https://github.dev/' +
    encodeURIComponent(git.owner) +
    '/' +
    encodeURIComponent(git.repo) +
    '/blob/' +
    encodeURIComponent(git.branch) +
    '/' +
    path
  );
}
