import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', 'apps/server/data'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi-line'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-else-return': 'error',
      'no-nested-ternary': 'error',
      'no-param-reassign': 'error',
      'no-return-assign': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['multiline-const', 'multiline-let', 'multiline-block-like', 'function', 'class'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['multiline-const', 'multiline-let', 'multiline-block-like', 'function', 'class'] },
      ],
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      complexity: ['error', 12],
      'max-depth': ['error', 4],
      'max-params': ['error', 5],
      'max-lines': ['error', { max: 520, skipBlankLines: true }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['apps/server/**/*.ts', 'apps/shared/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/server/scripts/**/*.ts', 'apps/server/src/testing/**/*.ts', '**/*.test.ts'],
    rules: { complexity: 'off', 'max-lines': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
)
