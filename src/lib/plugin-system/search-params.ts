// URL search params of the workspace-details container.
//   ?item=file:utils      → the active tab ("type:id")
//   &panels=agent         → extra sidebar panels switched on (comma list)

export interface DetailSearch {
  item?: string;
  panels?: string;
}

export const itemKey = (type: string, id: string) => `${type}:${id}`;

export function parseItem(key?: string): { type: string; id: string } | undefined {
  if (!key) return undefined;
  const i = key.indexOf(':');
  if (i <= 0 || i === key.length - 1) return undefined;
  return { type: key.slice(0, i), id: key.slice(i + 1) };
}

export function validateDetailSearch(raw: Record<string, unknown>): DetailSearch {
  const item = typeof raw.item === 'string' && parseItem(raw.item) ? raw.item : undefined;
  const panels = typeof raw.panels === 'string' && raw.panels ? raw.panels : undefined;
  return { item, panels };
}

export const parsePanels = (s?: string): string[] => (s ? s.split(',').filter(Boolean) : []);

/** Toggle one panel id; returns undefined (no param) when nothing is on. */
export function togglePanel(s: string | undefined, id: string): string | undefined {
  const list = parsePanels(s);
  const next = list.includes(id) ? list.filter((p) => p !== id) : [...list, id];
  return next.length ? next.join(',') : undefined;
}
