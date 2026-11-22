// ─────────────────────────────────────────────────────────────
// core.agent — adds a panel INTO the workspace.detail sidebar
// container plus the button that toggles it.
// ─────────────────────────────────────────────────────────────
import { lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const agentPlugin = definePlugin({
  id: 'core.agent',

  activities: [
    {
      id: 'agent',
      title: 'Agent',
      icon: Sparkles,
      order: 20,
      enabledWhen: (loc) => loc.container === 'workspace.detail',
      disabledReason: 'open a workspace first',
      action: { kind: 'togglePanel', panelId: 'agent' },
    },
  ],

  panels: [
    {
      id: 'agent',
      title: 'Agent',
      container: 'workspace.detail',
      order: 20, // below the Explorer
      component: lazy(() => import('./components/AgentPanel')),
    },
  ],
});
