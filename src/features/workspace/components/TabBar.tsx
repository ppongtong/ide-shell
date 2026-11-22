import { useRef, type KeyboardEvent } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { parseItem, useRegistry, type WorkspaceInfo } from '@/lib/plugin-system';
import { indexItems } from '../lib/search';
import { useTabActions } from '../hooks/useTabs';

interface Props {
  workspace: WorkspaceInfo | null;
  openKeys: readonly string[];
  activeKey?: string;
}

export function TabBar({ workspace, openKeys, activeKey }: Props) {
  const registry = useRegistry();
  const wsId = workspace?.id ?? '__new__';
  const actions = useTabActions(workspace);
  const listRef = useRef<HTMLDivElement>(null);

  const byKey = workspace ? indexItems(workspace).byKey : undefined;
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
      actions.showDetails();
    } else {
      const nextKey = openKeys[next - 1];
      if (nextKey) actions.activateKey(nextKey);
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
            actions.showDetails();
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
          const item = byKey?.get(key);
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
                onClick={() => {
                  actions.activateKey(key);
                }}
                onKeyDown={(e) => onTabKeyDown(e, i + 1)}
              >
                {Icon && <Icon size={14} />}
                {name}
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Close ${name}`}
                onClick={() => {
                  actions.closeKey(key);
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
    </div>
  );
}
