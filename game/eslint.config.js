import js from '@eslint/js';
import {defineConfig, globalIgnores} from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFiles = ['src/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.mjs'];

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', '.playwright-mcp/**', 'test-results/**']),
  {
    files: sourceFiles,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {globals: {...globals.browser, ...globals.node}},
    rules: {
      'max-statements-per-line': ['error', {max: 1}],
      'max-lines': ['warn', {max: 300, skipBlankLines: true, skipComments: true}],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      eqeqeq: 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {globals: globals.node},
  },
  {
    files: ['src/domain/**/*.ts', 'src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{name: 'phaser', message: 'Domain/data phải thuần, không phụ thuộc Phaser.'}],
          patterns: [
            {group: ['phaser/**'], message: 'Domain/data phải thuần, không phụ thuộc Phaser.'},
            {
              group: [
                '**/game',
                '**/game/**',
                '**/ui',
                '**/ui/**',
                '**/input',
                '**/input/**',
                '**/storage',
                '**/storage/**',
              ],
              message: 'Domain/data không được phụ thuộc tầng game, UI, input hoặc storage.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/game/systems/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {group: ['**/ui', '**/ui/**'], message: 'System không phụ thuộc UI; gửi kết quả cho scene điều phối.'},
          ],
        },
      ],
    },
  },
  // legacy: dọn khi refactor
  {files: ['src/domain/camping.ts'], rules: {'no-empty': 'warn'}},
  // legacy: dọn khi refactor
  {files: ['src/storage/preferences.ts'], rules: {'no-empty': 'warn'}},
  // legacy: dọn khi refactor
  {files: ['tests/camping.spec.ts'], rules: {'@typescript-eslint/no-explicit-any': 'warn'}},
  // legacy: dọn khi refactor
  {files: ['tests/firebase.spec.ts'], rules: {'@typescript-eslint/no-explicit-any': 'warn'}},
  // legacy: dọn khi refactor
  {files: ['tests/hud.spec.ts'], rules: {'@typescript-eslint/no-explicit-any': 'warn'}},
  // legacy: dọn khi refactor
  {files: ['tests/rendering.spec.ts'], rules: {'@typescript-eslint/no-explicit-any': 'warn'}},
]);
