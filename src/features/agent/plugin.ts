// ─────────────────────────────────────────────────────────────
// core.agent — adds a panel INTO the workspace sidebar plus the
// button that toggles it. It never touches the workspace feature.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';
import { WORKSPACE_DETAIL_CONTAINER } from '@/contracts/workspace';

export const agentPlugin = definePlugin({
  id: 'core.agent',

  activities: [
    {
      id: 'agent',
      title: 'Agent',
      icon: Sparkles,
      order: 20,
      enabledWhen: (loc) => loc.routeId === WORKSPACE_DETAIL_CONTAINER,
      disabledReason: 'open a workspace first',
      action: { kind: 'togglePanel', panelId: 'agent' },
    },
  ],

  panels: [
    {
      id: 'agent',
      title: 'Agent',
      container: WORKSPACE_DETAIL_CONTAINER,
      order: 20, // below the Explorer
      component: lazy(() => import('./components/AgentPanel')),
    },
  ],
});
