// Layout for /workspaces/*. Loads workspace summaries once for both the list
// page and the detail breadcrumb switcher. No component → renders <Outlet />.
import { createFileRoute } from '@tanstack/react-router';
import { workspacesApi } from '@/features/workspace';

export const Route = createFileRoute('/workspaces')({
  loader: () => workspacesApi.list(),
  staticData: { crumb: () => 'Workspaces' },
});
