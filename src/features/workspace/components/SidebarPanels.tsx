// ─────────────────────────────────────────────────────────────
// Stacked sidebar panel host for a given container (e.g. 'workspace.detail').
// Panels receive zero domain props and read shared feature contracts instead.
// ─────────────────────────────────────────────────────────────
import { Suspense } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { togglePanel, useRegistry } from '@/lib/plugin-system';
import { ResizableStack } from '@/components/ui/ResizableStack';
import { useWorkbench } from '../stores/workbench';

interface Props {
  container: string;
  panels: readonly string[];
  allowOptional?: boolean;
}

export function SidebarPanels({ container, panels, allowOptional = true }: Props) {
  const registry = useRegistry();
  const navigate = useNavigate();
  const sizes = useWorkbench((s) => s.panelSizes);
  const setSizes = useWorkbench((s) => s.setPanelSizes);

  const close = (panelId: string) => {
    if (!allowOptional) return;
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, panels: togglePanel(prev.panels, panelId) }),
      replace: true,
    });
  };

  const sections = registry.panelsFor(container).map((p) => {
    const Panel = p.component;
    return {
      id: p.id,
      title: p.title,
      visible: !!p.alwaysOn || (allowOptional && panels.includes(p.id)),
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
          <Panel />
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
