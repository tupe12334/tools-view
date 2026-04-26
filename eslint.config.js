import config from 'eslint-config-agent';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  ...config,
  {
    files: ['src/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-object-injection': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  {
    files: ['src/**/*.{spec,test}.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'error/no-literal-error-message': 'off',
    },
  },
  {
    files: ['src/viewer/main.ts'],
    rules: {
      'ddd/require-spec-file': 'off',
      'max-lines': 'off',
      'no-restricted-syntax': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/viewer/renderer/cytoscape-renderer.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'cytoscape',
              message:
                'cytoscape may only be imported from src/viewer/renderer/cytoscape-renderer.ts. Use the GraphRenderer interface instead.',
            },
            {
              name: 'cytoscape-fcose',
              message: 'cytoscape plugins may only be imported from cytoscape-renderer.ts.',
            },
            {
              name: 'cytoscape-dagre',
              message: 'cytoscape plugins may only be imported from cytoscape-renderer.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/viewer/renderer/cytoscape-renderer.ts',
      'src/viewer/renderer/graph-renderer.ts',
      'src/viewer/renderer/renderer-theme.ts',
      'src/viewer/renderer/layout-opts.ts',
      'src/viewer/renderer/node-event.ts',
      'src/viewer/renderer/style-rule.ts',
    ],
    rules: {
      'ddd/require-spec-file': 'off',
    },
  },
  {
    files: [
      'src/viewer/renderer/cytoscape-renderer.ts',
      'src/viewer/renderer/cytoscape-plugins.d.ts',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      'single-export/single-export': 'off',
    },
  },
  {
    files: ['src/viewer/renderer/cytoscape-stylesheet.spec.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
