// /workspaces/$wsId?item=file:utils&panels=agent
import { createFileRoute, retainSearchParams } from '@tanstack/react-router';
import { validateDetailSearch } from '@/lib/plugin-system';
import { WorkspaceBreadcrumbs, WorkspaceDetailPage, workspacesApi } from '@/features/workspace';

export const Route = createFileRoute('/workspaces/$wsId')({
  validateSearch: validateDetailSearch,
  search: { middlewares: [retainSearchParams(['panels'])] },
  loader: ({ params }) => workspacesApi.get(params.wsId),
  staticData: {
    container: 'workspace.detail',
    Breadcrumbs: WorkspaceBreadcrumbs,
  },
  component: WorkspaceDetailPage,
  errorComponent: ({ error }) => (
    <div className="empty">{error instanceof Error ? error.message : 'Could not open this workspace.'}</div>
  ),
});
