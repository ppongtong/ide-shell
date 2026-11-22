// Draft workspace creation screen (/workspaces/new).
// Publishes draft state to `@/features/workspace/contract` so Explorer renders its setup prompt.
import { useSyncWorkspaceContract } from '../hooks/useSyncWorkspaceContract';
import { SidebarPanels } from '../components/SidebarPanels';
import { TabBar } from '../components/TabBar';
import { EditorHost } from '../components/EditorHost';

const NO_PANELS: readonly string[] = Object.freeze([]);

export function NewWorkspacePage() {
  useSyncWorkspaceContract(null);

  return (
    <div className="ws-detail">
      <title>New workspace · IDE</title>
      <SidebarPanels container="workspace.detail" panels={NO_PANELS} allowOptional={false} />
      <div className="editor-col">
        <TabBar workspace={null} />
        <EditorHost workspace={null} />
      </div>
    </div>
  );
}
