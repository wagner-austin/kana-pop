// NOTE: We use flat-config so we must enumerate any browser globals
// we reference in code; otherwise ESLint flags them as no-undef.
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import path from 'node:path';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  localStorage: 'readonly',
  console: 'readonly'
};

export default [
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: { ...(js.configs.recommended.languageOptions?.globals || {}), ...browserGlobals }
    },
    ignores: ['**/*.json', 'index.html']
  },
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: path.resolve('./tsconfig.json'), sourceType: 'module' },
      globals: browserGlobals
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  prettier
];
