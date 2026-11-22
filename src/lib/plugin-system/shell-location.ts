// ─────────────────────────────────────────────────────────────
// ShellLocation = "where am I", derived from the URL only via
// TanStack Router's typed useMatch (zero `as` casts).
// ─────────────────────────────────────────────────────────────
import { useLocation, useMatch } from '@tanstack/react-router';
import type { ShellLocation } from './types';
import { parseItem, parsePanels } from './search-params';

export function useShellLocation(): ShellLocation {
  const path = useLocation({ select: (l) => l.pathname });
  const detail = useMatch({ from: '/workspaces/$wsId', shouldThrow: false });
  const create = useMatch({ from: '/workspaces/new', shouldThrow: false });
  const list = useMatch({ from: '/workspaces/', shouldThrow: false });
  const settings = useMatch({ from: '/settings', shouldThrow: false });
  const pluginPage = useMatch({ from: '/$activityId/$', shouldThrow: false });

  if (detail) {
    return {
      path,
      view: 'workspace.detail',
      wsId: detail.params.wsId,
      panels: parsePanels(detail.search.panels),
      item: parseItem(detail.search.item),
    };
  }
  if (create) return { path, view: 'workspace.new', panels: [] };
  if (list) return { path, view: 'workspace.list', panels: [] };
  if (settings) return { path, view: 'settings', panels: [] };
  if (pluginPage) return { path, view: 'plugin', panels: [] };
  return { path, view: 'other', panels: [] };
}
