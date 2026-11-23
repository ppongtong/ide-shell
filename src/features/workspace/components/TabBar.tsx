import { useRef, type KeyboardEvent } from 'react';
import { KeyRound, X } from 'lucide-react';
import { parseItem, PRIMARY_TYPE, useRegistry, type Item, type WorkspaceInfo } from '@/lib/plugin-system';
import { indexItems } from '../lib/search';
import { useTabActions } from '../hooks/useTabs';

interface Props {
  workspace: WorkspaceInfo;
  primaryItem: Item | undefined;
  openKeys: readonly string[];
  activeKey?: string;
}

export function TabBar({ workspace, primaryItem, openKeys, activeKey }: Props) {
  const registry = useRegistry();
  const actions = useTabActions(workspace);
  const listRef = useRef<HTMLDivElement>(null);

  const primaryRenderer = registry.itemRenderer.get(PRIMARY_TYPE);
  const PrimaryIcon = primaryRenderer?.icon ?? KeyRound;
  const primaryLabel = primaryItem?.name ?? primaryRenderer?.label ?? 'Primary';

  const { byKey } = indexItems(workspace);
  const totalTabs = 1 + openKeys.length; // index 0 = pinned Primary tab

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % totalTabs;
    else if (e.key === 'ArrowLeft') next = (index - 1 + totalTabs) % totalTabs;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = totalTabs - 1;
    if (next === -1) return;
    e.preventDefault();
    if (next === 0) {
      actions.showPrimary();
    } else {
      const nextKey = openKeys[next - 1];
      if (nextKey) actions.activateKey(nextKey);
    }
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  const primaryActive = !activeKey;
  const activeTabInBar = !!activeKey && openKeys.includes(activeKey);

  return (
    <div ref={listRef} className="tabbar" role="tablist" aria-label="Open items">
      {/* Pinned, non-closable first tab (renders the `type: 'primary'` plugin) */}
      <div className={`tab pinned ${primaryActive ? 'active' : ''}`}>
        <button
          type="button"
          id={`tab-${workspace.id}-__primary__`}
          className="tab-label"
          role="tab"
          tabIndex={primaryActive || !activeTabInBar ? 0 : -1}
          aria-selected={primaryActive}
          aria-controls={`panel-${workspace.id}-__primary__`}
          onClick={() => {
            actions.showPrimary();
          }}
          onKeyDown={(e) => onTabKeyDown(e, 0)}
        >
          <PrimaryIcon size={14} aria-hidden="true" />
          {primaryLabel}
        </button>
      </div>

      {openKeys.map((key, i) => {
        const ref = parseItem(key);
        if (!ref) return null;
        const item = byKey.get(key);
        const Icon = registry.itemRenderer.get(ref.type)?.icon;
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
