const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  {
    ignores: [
      '.expo/**',
      'dist/**',
      'web-build/**',
      'coverage/**',
      'ios/**',
      'android/**',
      'example/**',
      'expo-env.d.ts',
    ],
  },
  ...expoConfig,
  prettierConfig,
  {
    files: ['**/*.{js,jsx,cjs,mjs,ts,tsx}'],
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'all',
          caughtErrors: 'all',
          ignoreRestSiblings: false,
        },
      ],
    },
  },
];
