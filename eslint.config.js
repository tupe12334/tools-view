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
];
