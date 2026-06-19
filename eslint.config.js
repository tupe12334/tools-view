import config from 'eslint-config-agent';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  ...config,
  {
    files: ['src/**/*.ts'],
    rules: {
      eqeqeq: ['error', 'always'],
      // A condition whose type makes it always truthy or always falsy is dead
      // code or a bug: e.g. testing a non-nullable value for `undefined`, or a
      // redundant `?.`/`&&` guard the types already rule out. Flag these so
      // stale null-checks and unreachable branches surface at lint time instead
      // of masking a logic error.
      '@typescript-eslint/no-unnecessary-condition': 'error',
      // Promises that are created but never awaited, returned, or explicitly
      // marked with `void` are silently dropped: rejections become unhandled
      // and execution order is non-deterministic. Require every promise to be
      // handled so async bugs surface at lint time instead of at runtime.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // Array.prototype.sort() without a compare function sorts elements as
      // strings, so [10, 9, 1].sort() yields [1, 10, 9]. Require an explicit
      // comparator for non-string arrays to prevent silent ordering bugs.
      '@typescript-eslint/require-array-sort-compare': [
        'error',
        { ignoreStringArrays: true },
      ],
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-object-injection': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Flag private class members that are never reassigned so they are
      // declared `readonly`, signalling intent and preventing accidental mutation.
      '@typescript-eslint/prefer-readonly': 'error',
      // Method shorthand signatures are type-checked bivariantly (unsafe);
      // property-style function signatures are checked contravariantly (safe).
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      // Require explicit return/argument types on exported (public API)
      // functions so module boundaries are self-documenting and stable.
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // Force `export type` for declarations that only re-export types. This
      // lets bundlers/transpilers erase type-only exports, avoids emitting
      // unnecessary runtime imports, and prevents accidental import cycles
      // through the barrel file.
      '@typescript-eslint/consistent-type-exports': 'error',
      // Disallow non-boolean values (nullable strings/numbers, `any`, etc.) in
      // boolean positions. `if (str)` silently treats both `undefined` and the
      // empty string as "missing", hiding the distinction; this rule forces the
      // nullish/empty cases to be handled explicitly so conditionals say what
      // they mean and edge cases can't slip through.
      '@typescript-eslint/strict-boolean-expressions': 'error',
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
    files: ['src/viewer/github-ide-url.ts'],
    rules: {
      'default/no-hardcoded-urls': 'off',
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
