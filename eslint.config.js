import config from 'eslint-config-agent';

export default [
  { ignores: ['dist/**', 'coverage/**'] },
  ...config,
  {
    files: ['src/**/*.ts'],
    rules: {
      eqeqeq: ['error', 'always'],
      // Array methods like map/filter/reduce/every/some/sort expect their
      // callback to return a value; forgetting the `return` silently yields
      // `undefined` for every element, producing arrays full of holes or
      // predicates that are always falsy. Require a return in these callbacks
      // (and forbid one in `forEach`, where a returned value is meaningless) so
      // these silent transform bugs surface at lint time.
      'array-callback-return': ['error', { checkForEach: true }],
      // Require shorthand for object properties and methods: `{ x }` instead of
      // `{ x: x }` and `{ f() {} }` instead of `{ f: function () {} }`. Shorthand
      // is less noisy, makes a property/value mismatch (`{ id: idd }` typo)
      // visually obvious, and keeps object literals consistent across the
      // codebase. Auto-fixable, so it carries no ongoing authoring cost.
      'object-shorthand': ['error', 'always'],
      // Require any function that returns a Promise to be declared `async`. A
      // plain function that returns a promise can still throw *synchronously*
      // before the promise is created, so a caller's `.catch()`/`await` never
      // sees that error — it escapes as a sync throw instead of a rejection.
      // Marking the function `async` guarantees every error path surfaces as a
      // rejection and gives the whole function one consistent contract. This
      // complements `no-floating-promises` (already enabled) for async hygiene.
      '@typescript-eslint/promise-function-async': 'error',
      // Prefer optional chaining (`a?.b`) over manual `&&` nullish-guard chains
      // (`a && a.b`). Optional chaining is shorter, evaluates the base once with
      // well-defined short-circuit semantics, and is less error-prone than
      // repeating the base expression across a long `&&` chain. Auto-fixable.
      '@typescript-eslint/prefer-optional-chain': 'error',
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
      // Require every `switch` over a union or enum type to handle all of its
      // members. When a discriminated union (e.g. EdgeType, NodeType) later
      // gains a new variant, any switch that forgot to handle it fails at lint
      // time instead of silently falling through to the wrong branch at
      // runtime. A forward guard for correctness as the type model evolves.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
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
      // Require an explicit return type on every function, not just the
      // exported ones. Relying on inference means a refactor deep inside a
      // helper can silently widen or change its return type and the mistake
      // only surfaces far away at the call site (or not at all). Writing the
      // type down turns the function's own body into the thing that gets
      // type-checked against the contract, and documents intent for readers.
      '@typescript-eslint/explicit-function-return-type': 'error',
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
      // Enforce `value as Type` over angle-bracket `<Type>value` (the latter is
      // ambiguous with JSX/generics) and forbid asserting object literals
      // (`{ ... } as Type`). An object-literal assertion silently suppresses
      // excess-property checking, so a typo'd or stray field passes type-checking
      // unnoticed; `satisfies Type` (or an explicitly typed variable) keeps the
      // full check. Narrowing assertions on existing values stay allowed.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
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
