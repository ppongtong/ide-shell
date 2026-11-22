// ESLint: TypeScript + React hooks/Compiler rules + the folder import rules.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

/** Block imports from the given folders. */
const forbid = (folders, message) => ({
  'no-restricted-imports': [
    'error',
    { patterns: folders.map((f) => ({ group: [`@/${f}`, `@/${f}/**`], message })) },
  ],
});

export default defineConfig([
  { ignores: ['dist', 'dist-demo', 'src/routeTree.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ── Folder rules ───────────────────────────────────────────
  // lib/ is the generic plugin SDK: it depends on nothing above it.
  {
    files: ['src/lib/**'],
    rules: forbid(
      ['app', 'routes', 'features', 'stores', 'contracts', 'components'],
      'lib/ must stay generic and not depend on app or domain code.',
    ),
  },
  // contracts/ defines shared domain types & helpers (e.g. workspace) on top of lib/.
  {
    files: ['src/contracts/**'],
    rules: forbid(
      ['app', 'routes', 'features', 'stores', 'components'],
      'contracts/ may only depend on lib/.',
    ),
  },
  // components/ is reusable UI: no plugins, routes, stores, contracts or features.
  {
    files: ['src/components/**'],
    rules: forbid(
      ['app', 'routes', 'features', 'stores', 'contracts', 'lib'],
      'components/ must stay app-agnostic.',
    ),
  },
  // stores/ holds app-wide state and cross-feature bridges only.
  {
    files: ['src/stores/**'],
    rules: forbid(['app', 'routes', 'features', 'components'], 'stores/ must not depend on features or UI.'),
  },
  // A feature never imports app/, routes/ or ANOTHER feature (use relative imports inside your own).
  {
    files: ['src/features/**'],
    rules: forbid(
      ['app', 'routes', 'features'],
      'Features talk through lib/, contracts/ and stores/. Inside your own feature, use relative imports.',
    ),
  },
  // The shell hosts features only through the generic plugin SDK and shell stores.
  {
    files: ['src/app/shell/**'],
    rules: forbid(
      ['features', 'routes', 'contracts'],
      'The shell must stay domain-agnostic; read contributions from the registry.',
    ),
  },
  {
    files: ['tests/**'],
    languageOptions: { globals: globals.node },
  },
]);
