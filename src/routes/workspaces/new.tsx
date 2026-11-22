import { createFileRoute } from '@tanstack/react-router';
import { NewWorkspacePage } from '@/features/workspace';

export const Route = createFileRoute('/workspaces/new')({
  staticData: {
    view: 'workspace.new',
    crumb: () => 'New workspace',
  },
  component: NewWorkspacePage,
});
