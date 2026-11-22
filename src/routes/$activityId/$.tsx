// Catch-all for plugin pages: /reports, /reports/q1, …
// The plugin owns everything after its id. Adding a plugin page needs no new file here.
import { createFileRoute } from '@tanstack/react-router';
import { PluginPageHost } from '@/app/shell/PluginPageHost';

export const Route = createFileRoute('/$activityId/$')({
  staticData: {
    crumb: (params, registry) => registry.activity.get(params.activityId ?? '')?.title ?? 'Not found',
  },
  component: PluginPageHost,
});
