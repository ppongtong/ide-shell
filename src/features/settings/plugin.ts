// core.settings — keyboard shortcuts dialog + user preferences page, pinned last on the bar.
import { lazy } from 'react';
import { CircleHelp, Settings } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const settingsPlugin = definePlugin({
  id: 'core.settings',
  activities: [
    {
      id: 'shortcuts',
      title: 'Keyboard shortcuts',
      icon: CircleHelp,
      order: 90,
      position: 'bottom',
      action: { kind: 'dialog', dialog: lazy(() => import('./components/ShortcutsDialog')) },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      order: 100,
      position: 'bottom',
      action: { kind: 'route', to: '/settings' }, // typed route in src/routes/settings.tsx
    },
  ],
});
