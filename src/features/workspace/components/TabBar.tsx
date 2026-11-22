import { useRef, type KeyboardEvent } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { parseItem, useRegistry, type WorkspaceInfo } from '@/lib/plugin-system';
import { useTabs } from '../hooks/useTabs';

export function TabBar({ workspace, activeKey }: { workspace: WorkspaceInfo | null; activeKey?: string }) {
  const registry = useRegistry();
  const wsId = workspace?.id ?? '__new__';
  const tabs = useTabs(wsId, activeKey);
  const listRef = useRef<HTMLDivElement>(null);

  const openKeys = workspace ? tabs.open : [];
  const totalTabs = 1 + openKeys.length; // index 0 = pinned Details tab

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % totalTabs;
    else if (e.key === 'ArrowLeft') next = (index - 1 + totalTabs) % totalTabs;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = totalTabs - 1;
    if (next === -1) return;
    e.preventDefault();
    if (next === 0) {
      if (workspace) tabs.showDetails();
    } else {
      const nextKey = openKeys[next - 1];
      if (nextKey) tabs.activate(nextKey);
    }
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  const detailsActive = !activeKey;

  return (
    <div ref={listRef} className="tabbar" role="tablist" aria-label="Open items">
      {/* Pinned, non-closable first tab */}
      <div className={`tab pinned ${detailsActive ? 'active' : ''}`}>
        <button
          type="button"
          id={`tab-${wsId}-__details__`}
          className="tab-label"
          role="tab"
          tabIndex={detailsActive ? 0 : -1}
          aria-selected={detailsActive}
          aria-controls={`panel-${wsId}-__details__`}
          onClick={() => {
            if (workspace) tabs.showDetails();
          }}
          onKeyDown={(e) => onTabKeyDown(e, 0)}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          Details
        </button>
      </div>

      {workspace &&
        openKeys.map((key, i) => {
          const ref = parseItem(key);
          if (!ref) return null;
          const item = workspace.items.find((it) => it.id === ref.id && it.type === ref.type);
          const Icon = registry.itemType.get(ref.type)?.icon;
          const active = key === activeKey;
          const name = item?.name ?? key;

          return (
            <div key={key} className={`tab ${active ? 'active' : ''}`}>
              <button
                type="button"
                id={`tab-${workspace.id}-${key}`}
                className="tab-label"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                aria-controls={`panel-${workspace.id}-${key}`}
                onClick={() => tabs.activate(key)}
                onKeyDown={(e) => onTabKeyDown(e, i + 1)}
              >
                {Icon && <Icon size={14} />}
                {name}
              </button>
              <button type="button" className="icon-btn" aria-label={`Close ${name}`} onClick={() => tabs.close(key)}>
                <X size={13} />
              </button>
            </div>
          );
        })}
    </div>
  );
}
