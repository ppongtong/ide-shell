// ─────────────────────────────────────────────────────────────
// feature.primary — pluggable `type: 'primary'` renderer.
// Swap this plugin in `src/app/plugins.ts` to customize how a
// workspace selects and displays its primary key / target dataset.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { KeyRound } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const primaryPlugin = definePlugin({
  id: 'feature.primary',
  itemRenderers: [
    {
      type: 'primary',
      label: 'Primary Key',
      icon: KeyRound,
      component: lazy(() => import('./components/PrimaryKeyComponent')),
    },
  ],
});
