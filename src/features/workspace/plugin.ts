// ─────────────────────────────────────────────────────────────
// core.workspace — Workspaces button, New workspace dialog button,
// and the built-in folder/file/dataset item renderers.
// (`type: 'primary'` is contributed as its own pluggable feature.)
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { FileCode, Folder, FolderKanban, FolderPlus, Table } from 'lucide-react';
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
      order: 80,
      position: 'bottom',
      action: { kind: 'dialog', dialog: lazy(() => import('./components/NewWorkspaceDialog')) },
    },
  ],

  itemRenderers: [
    { type: 'folder', label: 'Folder', icon: Folder },
    {
      type: 'file',
      label: 'File',
      pluralLabel: 'Files',
      icon: FileCode,
      component: lazy(() => import('./editors/FileEditor')),
    },
    {
      type: 'dataset',
      label: 'Dataset',
      pluralLabel: 'Datasets',
      icon: Table,
      component: lazy(() => import('./editors/DatasetEditor')),
    },
  ],
});
