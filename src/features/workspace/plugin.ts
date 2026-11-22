// ─────────────────────────────────────────────────────────────
// core.workspace — Workspaces button, New workspace button,
// the Explorer panel and the built-in item types.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { FileCode, Folder, FolderKanban, FolderPlus, Table } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';
import ExplorerPanel from './components/ExplorerPanel';

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
      action: { kind: 'dialog', dialog: lazy(() => import('./components/NewWorkspaceDialog')) },
    },
  ],

  panels: [
    {
      id: 'explorer',
      title: 'Explorer',
      container: 'workspace.detail',
      order: 10,
      alwaysOn: true,
      component: ExplorerPanel,
    },
  ],

  itemTypes: [
    { type: 'folder', label: 'Folder', icon: Folder, isContainer: true },
    { type: 'file', label: 'File', icon: FileCode, editor: lazy(() => import('./editors/FileEditor')) },
    { type: 'dataset', label: 'Dataset', icon: Table, editor: lazy(() => import('./editors/DatasetEditor')) },
  ],
});
