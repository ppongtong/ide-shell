// core.settings — user preferences, pinned last on the bar.
import { Settings } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const settingsPlugin = definePlugin({
  id: 'core.settings',
  activities: [
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
