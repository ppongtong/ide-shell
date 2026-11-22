// ─────────────────────────────────────────────────────────────
// example.notebook — standalone feature plugin contributing an
// Explorer `ItemType` + lazy tab renderer (`NotebookEditor`)
// without touching `features/workspace` or `features/explorer`.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { BookOpen } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const notebookPlugin = definePlugin({
  id: 'example.notebook',
  itemTypes: [
    {
      type: 'notebook',
      label: 'Notebook',
      pluralLabel: 'Notebooks',
      icon: BookOpen,
      editor: lazy(() => import('./editors/NotebookEditor')),
    },
  ],
});
