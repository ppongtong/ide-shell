// ─────────────────────────────────────────────────────────────
// The workspace sidebar: every panel registered for
// 'workspace.detail', stacked. Explorer is always on; others show
// when listed in ?panels=. Hidden panels stay mounted (<Activity>),
// so e.g. the agent chat survives being toggled off and on.
// ─────────────────────────────────────────────────────────────
import { Suspense } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { togglePanel, useRegistry, type WorkspaceInfo } from '@/lib/plugin-system';
import { ResizableStack } from '@/components/ui/ResizableStack';
import { useWorkbench } from '../stores/workbench';

interface Props {
  workspace: WorkspaceInfo | null;
  panels: readonly string[];
}

export function SidebarPanels({ workspace, panels }: Props) {
  const registry = useRegistry();
  const navigate = useNavigate();
  const sizes = useWorkbench((s) => s.panelSizes);
  const setSizes = useWorkbench((s) => s.setPanelSizes);

  const close = (panelId: string) => {
    if (!workspace) return;
    void navigate({
      to: '/workspaces/$wsId',
      params: { wsId: workspace.id },
      search: (prev) => ({ ...prev, panels: togglePanel(prev.panels, panelId) }),
      replace: true,
    });
  };

  const sections = registry.panelsFor('workspace.detail').map((p) => {
    const Panel = p.component;
    return {
      id: p.id,
      title: p.title,
      visible: !!p.alwaysOn || (workspace !== null && panels.includes(p.id)),
      header: (
        <>
          <span>{p.title}</span>
          {!p.alwaysOn && (
            <button type="button" className="icon-btn" aria-label={`Close ${p.title}`} onClick={() => close(p.id)}>
              <X size={14} />
            </button>
          )}
        </>
      ),
      body: (
        <Suspense fallback={<div className="empty">Loading…</div>}>
          <Panel workspace={workspace} />
        </Suspense>
      ),
    };
  });

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <ResizableStack sections={sections} sizes={sizes} onResize={setSizes} focusOnShow />
    </aside>
  );
}
