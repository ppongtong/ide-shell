// Draft workspace creation screen (/workspaces/new).
// Uses the same workbench layout as WorkspaceDetailPage so the pinned Details
// tab flows directly into the saved workspace once required fields are created.
import { SidebarPanels } from '../components/SidebarPanels';
import { TabBar } from '../components/TabBar';
import { EditorHost } from '../components/EditorHost';

const NO_PANELS: readonly string[] = Object.freeze([]);

export function NewWorkspacePage() {
  return (
    <div className="ws-detail">
      <title>New workspace · IDE</title>
      <SidebarPanels workspace={null} panels={NO_PANELS} />
      <div className="editor-col">
        <TabBar workspace={null} />
        <EditorHost workspace={null} />
      </div>
    </div>
  );
}
