import { createFileRoute } from '@tanstack/react-router';
import { NewWorkspacePage } from '@/features/workspace';

export const Route = createFileRoute('/workspaces/new')({
  staticData: { crumb: () => 'New workspace' },
  component: NewWorkspacePage,
});
