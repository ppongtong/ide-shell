// ─────────────────────────────────────────────────────────────
// example.notebook — standalone feature plugin contributing an
// Explorer `ItemRenderer` (`type: 'notebook' -> NotebookEditor`)
// without touching `features/workspace` or `features/explorer`.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { BookOpen } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const notebookPlugin = definePlugin({
  id: 'example.notebook',
  itemRenderers: [
    {
      type: 'notebook',
      label: 'Notebook',
      pluralLabel: 'Notebooks',
      icon: BookOpen,
      component: lazy(() => import('./editors/NotebookEditor')),
    },
  ],
});
