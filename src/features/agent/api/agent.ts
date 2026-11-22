// ─────────────────────────────────────────────────────────────
// Mock agent. Swap for your real agent endpoint.
// Consumes public contracts from BOTH `workspace` and `explorer`
// without importing either feature's internal implementation.
// Understands: "open <item>", "close <item>", "collapse all", "expand all".
// ─────────────────────────────────────────────────────────────
import type { Item, ItemType } from '@/lib/plugin-system';
import type { WorkspaceSnapshot } from '@/features/workspace/contract';

export type AgentAction =
  | { readonly target: 'workspace'; readonly type: 'openItem' | 'closeItem'; readonly itemId: string }
  | { readonly target: 'workspace'; readonly type: 'showDetails' }
  | { readonly target: 'explorer'; readonly type: 'collapseAll' | 'expandAll' }
  | { readonly target: 'explorer'; readonly type: 'revealItems'; readonly wsId: string; readonly nodeIds: readonly string[] };

export interface AgentReply {
  readonly text: string;
  readonly actions: readonly AgentAction[];
}

type TypeMeta = ReadonlyMap<string, Pick<ItemType, 'isContainer' | 'pinnedRoot'>>;

export const agentApi = {
  ask: (question: string, context: WorkspaceSnapshot | null, delayMs = 600, itemTypes?: TypeMeta) =>
    new Promise<AgentReply>((resolve) => setTimeout(() => resolve(reply(question, context, itemTypes)), delayMs)),
};

function chainIdsTo(items: readonly Item[], id: string): string[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const ids: string[] = [];
  for (let cur = byId.get(id); cur; cur = cur.parentId ? byId.get(cur.parentId) : undefined) {
    ids.unshift(cur.id);
  }
  return ids;
}

function reply(question: string, ctx: WorkspaceSnapshot | null, itemTypes?: TypeMeta): AgentReply {
  const ws = ctx?.workspace;
  if (!ws) return { text: '(demo) Open a workspace first.', actions: [] };

  const normalized = question.trim().toLowerCase();
  if (normalized === 'collapse all') {
    return {
      text: `(demo) Collapsing all Explorer sections in ${ws.name}.`,
      actions: [{ target: 'explorer', type: 'collapseAll' }],
    };
  }
  if (normalized === 'expand all') {
    return {
      text: `(demo) Expanding all Explorer sections in ${ws.name}.`,
      actions: [{ target: 'explorer', type: 'expandAll' }],
    };
  }
  if (normalized === 'show details' || normalized === 'open details') {
    return {
      text: `(demo) Showing ${ws.name} details.`,
      actions: [{ target: 'workspace', type: 'showDetails' }],
    };
  }

  const command = /^(open|close)\s+(.+)$/i.exec(question.trim());
  if (command) {
    const [, verb = '', name = ''] = command;
    const wanted = name.toLowerCase();
    const item = ws.items.find((i) => i.name.toLowerCase() === wanted || i.id === wanted);
    if (!item) return { text: `(demo) There's no “${name}” in ${ws.name}.`, actions: [] };

    const meta = itemTypes?.get(item.type);
    const isContainer = meta ? !!meta.isContainer : item.type === 'folder' || item.type === 'primary';
    const isPinnedRoot = meta ? !!meta.pinnedRoot : item.type === 'primary';
    const open = verb.toLowerCase() === 'open';

    if (isContainer) {
      if (!open) return { text: `(demo) ${item.name} is a container, not an openable tab.`, actions: [] };
      const nodeIds = chainIdsTo(ws.items, item.id);
      const actions: AgentAction[] = isPinnedRoot
        ? [
            { target: 'workspace', type: 'showDetails' },
            { target: 'explorer', type: 'revealItems', wsId: ws.id, nodeIds },
          ]
        : [{ target: 'explorer', type: 'revealItems', wsId: ws.id, nodeIds }];
      return {
        text: `(demo) Revealing ${item.name}.`,
        actions,
      };
    }

    return {
      text: `(demo) ${open ? 'Opening' : 'Closing'} ${item.name}.`,
      actions: [{ target: 'workspace', type: open ? 'openItem' : 'closeItem', itemId: item.id }],
    };
  }

  const where = ctx.activeItem ? `${ctx.activeItem.name} in ${ws.name}` : ws.name;
  return {
    text: `(demo) I'd look at ${where} to answer “${question}”. Try “open <name>”, “close <name>”, or “collapse all”.`,
    actions: [],
  };
}
