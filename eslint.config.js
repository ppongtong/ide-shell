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
  // lib/ is the plugin SDK: it depends on nothing above it.
  {
    files: ['src/lib/**'],
    rules: forbid(['app', 'routes', 'features', 'stores', 'components'], 'lib/ must not depend on app code.'),
  },
  // components/ is reusable UI: no plugins, routes, stores or features.
  {
    files: ['src/components/**'],
    rules: forbid(['app', 'routes', 'features', 'stores', 'lib'], 'components/ must stay app-agnostic.'),
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
      'Features talk through lib/plugin-system (props, registry). Inside your own feature, use relative imports.',
    ),
  },
  // The shell hosts features only through the registry.
  {
    files: ['src/app/shell/**'],
    rules: forbid(['features', 'routes'], 'The shell must not import features; read them from the registry.'),
  },
]);
