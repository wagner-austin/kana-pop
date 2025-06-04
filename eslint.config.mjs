// NOTE: We use flat-config so we must enumerate any browser globals
// we reference in code; otherwise ESLint flags them as no-undef.
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import path from 'node:path';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  localStorage: 'readonly',
  console: 'readonly',
  matchMedia: 'readonly',
};

// @ts-expect-error - TypeScript may incorrectly infer the type of js.configs.recommended,
// believing it lacks languageOptions. This directive bypasses the check for this line,
// assuming the runtime object structure is correct as per ESLint standards.
const recommendedLangOptions = js.configs.recommended.languageOptions;

const mergedGlobals = {
  ...(recommendedLangOptions?.globals ?? {}),
  ...browserGlobals,
};

export default [
  {
    ...js.configs.recommended,

    languageOptions: {
      ...recommendedLangOptions,
      globals: mergedGlobals,
    },
    ignores: ['**/*.json', 'index.html'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: path.resolve('./tsconfig.json'), sourceType: 'module' },
      globals: mergedGlobals,
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/utils/Logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  eslintPluginPrettierRecommended,
];
