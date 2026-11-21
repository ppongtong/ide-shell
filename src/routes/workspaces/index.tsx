import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceListPage } from '@/features/workspace';

export const Route = createFileRoute('/workspaces/')({
  component: WorkspaceListPage,
});
