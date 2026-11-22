// ─────────────────────────────────────────────────────────────
// core.workspace — Workspaces button, New workspace button,
// and the built-in workspace item types.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { FileCode, Folder, FolderKanban, FolderPlus, KeyRound, Table } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const workspacePlugin = definePlugin({
  id: 'core.workspace',

  activities: [
    {
      id: 'workspaces',
      title: 'Workspaces',
      icon: FolderKanban,
      order: 10,
      action: { kind: 'route', to: '/workspaces', rememberLastLocation: true },
    },
    {
      id: 'new-workspace',
      title: 'New workspace',
      icon: FolderPlus,
      order: 90,
      position: 'bottom',
      action: { kind: 'route', to: '/workspaces/new' },
    },
  ],

  itemTypes: [
    { type: 'primary', label: 'Primary', icon: KeyRound, isContainer: true },
    { type: 'folder', label: 'Folder', icon: Folder, isContainer: true },
    {
      type: 'file',
      label: 'File',
      pluralLabel: 'Files',
      icon: FileCode,
      editor: lazy(() => import('./editors/FileEditor')),
    },
    {
      type: 'dataset',
      label: 'Dataset',
      pluralLabel: 'Datasets',
      icon: Table,
      editor: lazy(() => import('./editors/DatasetEditor')),
    },
  ],
});
