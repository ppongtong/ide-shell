// The ONE list of features the app loads. Order here doesn't matter;
// each contribution carries its own `order`.
import type { Plugin } from '@/lib/plugin-system';
import { workspacePlugin } from '@/features/workspace';
import { primaryPlugin } from '@/features/primary';
import { explorerPlugin } from '@/features/explorer';
import { agentPlugin } from '@/features/agent';
import { notebookPlugin } from '@/features/notebook';
import { reportsPlugin } from '@/features/reports';
import { settingsPlugin } from '@/features/settings';

export const plugins: readonly Plugin[] = [
  workspacePlugin,
  primaryPlugin,
  explorerPlugin,
  agentPlugin,
  notebookPlugin,
  reportsPlugin,
  settingsPlugin,
];
