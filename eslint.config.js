// ESLint: TypeScript + React hooks/Compiler rules + strict folder & plugin-contract boundaries.
import fs from 'node:fs';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

const featureNames = fs
  .readdirSync(new URL('./src/features', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

/** Block both `@/<folder>` aliases and relative `../<folder>` escapes. */
const forbidFolders = (folders, message, extraPatterns = []) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        ...folders.map((f) => ({
          group: [`@/${f}`, `@/${f}/**`, `../${f}`, `../${f}/**`, `../../${f}`, `../../${f}/**`, `../../../${f}/**`],
          message,
        })),
        ...extraPatterns,
      ],
    },
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

  // ── Folder & plugin boundary rules ─────────────────────────
  // 1. lib/ is the IDE plugin SDK: it depends on nothing above it.
  {
    files: ['src/lib/**'],
    rules: forbidFolders(
      ['app', 'routes', 'features', 'stores', 'components'],
      'lib/ must not depend on app code.',
    ),
  },
  // 2. components/ is reusable UI: no plugins, routes, stores or features.
  {
    files: ['src/components/**'],
    rules: forbidFolders(
      ['app', 'routes', 'features', 'stores', 'lib'],
      'components/ must stay app-agnostic.',
    ),
  },
  // 3. stores/ holds app-wide shell state & persistence helpers only.
  {
    files: ['src/stores/**'],
    rules: forbidFolders(
      ['app', 'routes', 'features', 'components'],
      'stores/ must not depend on features or UI.',
    ),
  },
  // 4. app/ and routes/ import a feature's barrel (`@/features/<name>`) only — never deep internals.
  {
    files: ['src/app/**', 'src/routes/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/**', '../features/**', '../../features/**', '../../../features/**'],
              message: 'Import from the feature barrel (`@/features/<name>`) only.',
            },
          ],
        },
      ],
    },
  },
  // 5. The shell frame hosts features only through the registry — never imports features or routes.
  {
    files: ['src/app/shell/**'],
    rules: forbidFolders(
      ['features', 'routes'],
      'The shell must not import features or routes; read contributions from the registry.',
    ),
  },
  // 6. Each feature is isolated: may only import ANOTHER feature's `contract` (`@/features/<other>/contract`).
  ...featureNames.map((own) => {
    const siblings = featureNames.filter((n) => n !== own);
    const siblingGroup = siblings.join('|');
    return {
      files: [`src/features/${own}/**`],
      rules: forbidFolders(
        ['app', 'routes'],
        'Features must not import app/ or routes/.',
        [
          {
            regex: `^@/features/${own}(/.*)?$`,
            message: 'Inside your own feature, use relative imports rather than `@/features/<own>`.',
          },
          ...(siblings.length
            ? [
                {
                  regex: `^@/features/(${siblingGroup})(/(?!contract$).*)?$`,
                  message: 'Features may only import another feature via `@/features/<name>/contract`.',
                },
                {
                  regex: `^(\\.\\./)+(${siblingGroup})(/.*)?$`,
                  message: 'Features must not import sibling features via relative paths; use `@/features/<name>/contract`.',
                },
              ]
            : []),
        ],
      ),
    };
  }),
  // 7. `contract.ts` is pure shared types + `createPluginBridge`: only `@/lib/plugin-system` allowed.
  {
    files: ['src/features/*/contract.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/routes/**', '@/features/**', '@/stores/**', '@/components/**', './*', '../*'],
              message: 'Feature contracts must stay pure and only import from `@/lib/plugin-system`.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['tests/**'],
    languageOptions: { globals: globals.node },
  },
]);
