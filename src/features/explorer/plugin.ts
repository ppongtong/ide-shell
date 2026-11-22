// ─────────────────────────────────────────────────────────────
// core.explorer — in-house sidebar plugin demonstrating bidirectional
// plugin state sharing:
//   • Consumes `@/features/workspace/contract` to display items & open tabs.
//   • Publishes `./contract` (`useExplorerContract`) so other features
//     (Breadcrumbs, Workspace, Agent) can reveal/collapse Explorer nodes.
// ─────────────────────────────────────────────────────────────
import { definePlugin } from '@/lib/plugin-system';
import ExplorerPanel from './components/ExplorerPanel';

export const explorerPlugin = definePlugin({
  id: 'core.explorer',
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
});
