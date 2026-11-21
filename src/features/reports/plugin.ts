// example.reports — a plugin with its OWN page, served by the catch-all
// route /$activityId/$. No change to src/routes needed.
import { lazy } from 'react';
import { ChartColumn } from 'lucide-react';
import { definePlugin } from '@/lib/plugin-system';

export const reportsPlugin = definePlugin({
  id: 'example.reports',
  activities: [
    {
      id: 'reports',
      title: 'Reports',
      icon: ChartColumn,
      order: 30,
      action: {
        kind: 'route',
        to: '/reports', // must be `/${id}` for plugin pages
        page: lazy(() => import('./pages/ReportsPage')),
        rememberLastLocation: true,
      },
    },
  ],
});
