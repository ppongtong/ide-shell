import { useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useRegistry } from '@/lib/plugin-system';
import { getItemTypes, parseItem, type WorkspaceInfo } from '@/contracts/workspace';
import { useTabs } from '../hooks/useTabs';

export function TabBar({ workspace, activeKey }: { workspace: WorkspaceInfo; activeKey?: string }) {
  const itemTypes = getItemTypes(useRegistry());
  const tabs = useTabs(workspace.id, activeKey);
  const listRef = useRef<HTMLDivElement>(null);

  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const len = tabs.open.length;
    if (!len) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % len;
    else if (e.key === 'ArrowLeft') next = (index - 1 + len) % len;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = len - 1;
    if (next === -1) return;
    e.preventDefault();
    const nextKey = tabs.open[next];
    if (!nextKey) return;
    tabs.activate(nextKey);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div ref={listRef} className="tabbar" role="tablist" aria-label="Open items">
      {tabs.open.map((key, index) => {
        const ref = parseItem(key);
        if (!ref) return null;
        const item = workspace.items.find((i) => i.id === ref.id && i.type === ref.type);
        const Icon = itemTypes.get(ref.type)?.icon;
        const active = key === activeKey;
        const focusable = active || (!activeKey && index === 0);
        const name = item?.name ?? key;

        return (
          <div key={key} className={`tab ${active ? 'active' : ''}`}>
            <button
              type="button"
              id={`tab-${workspace.id}-${key}`}
              className="tab-label"
              role="tab"
              tabIndex={focusable ? 0 : -1}
              aria-selected={active}
              aria-controls={`panel-${workspace.id}-${key}`}
              onClick={() => tabs.activate(key)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
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
