// Draft workspace creation screen (/workspaces/new).
// Publishes draft state to `@/features/workspace/contract` so Explorer renders its setup prompt.
import { EMPTY } from '@/lib/plugin-system';
import { useSyncWorkspaceContract } from '../hooks/useSyncWorkspaceContract';
import { SidebarPanels } from '../components/SidebarPanels';
import { TabBar } from '../components/TabBar';
import { EditorHost } from '../components/EditorHost';

export function NewWorkspacePage() {
  useSyncWorkspaceContract(null);

  return (
    <div className="ws-detail">
      <title>New workspace · IDE</title>
      <SidebarPanels container="workspace.detail" panels={EMPTY} allowOptional={false} />
      <div className="editor-col">
        <TabBar workspace={null} openKeys={EMPTY} />
        <EditorHost workspace={null} openKeys={EMPTY} />
      </div>
    </div>
  );
}
