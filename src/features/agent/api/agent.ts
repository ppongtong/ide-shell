// ─────────────────────────────────────────────────────────────
// Mock agent & contract action dispatcher.
// Consumes public contracts from BOTH `workspace` and `explorer`
// without importing either feature's internals, item-type rules, or route paths.
// Understands: "primary key", "show primary", "open <item>", "close <item>", "collapse all", "expand all".
// ─────────────────────────────────────────────────────────────
import { useWorkspaceContract, type WorkspaceSnapshot } from '@/features/workspace/contract';
import { useExplorerContract } from '@/features/explorer/contract';

export type AgentAction =
  | { readonly target: 'workspace'; readonly type: 'openItem' | 'closeItem'; readonly itemId: string }
  | { readonly target: 'workspace'; readonly type: 'showPrimary' }
  | { readonly target: 'explorer'; readonly type: 'collapseAll' | 'expandAll' };

export interface AgentReply {
  readonly text: string;
  readonly actions: readonly AgentAction[];
}

export const agentApi = {
  ask: (question: string, context: WorkspaceSnapshot | null, delayMs = 600) =>
    new Promise<AgentReply>((resolve) => setTimeout(() => resolve(reply(question, context)), delayMs)),
};

function reply(question: string, ctx: WorkspaceSnapshot | null): AgentReply {
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
  if (normalized === 'show primary' || normalized === 'open primary') {
    return {
      text: `(demo) Showing ${ws.name} primary view.`,
      actions: [{ target: 'workspace', type: 'showPrimary' }],
    };
  }
  if (/^(what(?:'s| is)\s+(?:the\s+)?)?primary(?:\s+key)?\??$/.test(normalized)) {
    const primary = ctx.primaryItem;
    if (!primary) {
      return {
        text: `(demo) ${ws.name} has no primary key selected yet. Opening the Primary Key selector.`,
        actions: [{ target: 'workspace', type: 'showPrimary' }],
      };
    }
    return {
      text: `(demo) Primary key in ${ws.name}: “${primary.name}” (id: ${primary.id}, type: ${primary.type}).`,
      actions: [],
    };
  }

  const command = /^(open|close)\s+(.+)$/i.exec(question.trim());
  if (command) {
    const [, verb = '', name = ''] = command;
    const wanted = name.toLowerCase();
    const item = ws.items.find((i) => i.name.toLowerCase() === wanted || i.id === wanted);
    if (!item) return { text: `(demo) There's no “${name}” in ${ws.name}.`, actions: [] };

    const open = verb.toLowerCase() === 'open';
    return {
      text: `(demo) ${open ? 'Opening' : 'Closing'} ${item.name}.`,
      actions: [{ target: 'workspace', type: open ? 'openItem' : 'closeItem', itemId: item.id }],
    };
  }

  const where = ctx.activeItem
    ? `${ctx.activeItem.name} in ${ws.name}`
    : ctx.primaryItem
      ? `${ctx.primaryItem.name} (${ctx.primaryItem.id}) in ${ws.name}`
      : ws.name;
  return {
    text: `(demo) I'd look at ${where} to answer “${question}”. Try “primary key”, “open <name>”, “close <name>”, or “collapse all”.`,
    actions: [],
  };
}

/**
 * Executes one `AgentAction` against the workspace/explorer contracts.
 * `openItem` opens a tab (or switches to Primary) and falls back to `revealItem` for folders.
 * Returns `null` on success, or a human-readable explanation if nothing changed.
 */
export function runAgentAction(action: AgentAction): string | null {
  if (action.target === 'explorer') {
    const explorerActions = useExplorerContract.getState().actions;
    if (!explorerActions) return 'Explorer is not available.';
    explorerActions[action.type]();
    return null;
  }

  const wsActions = useWorkspaceContract.getState().actions;
  if (!wsActions) return 'Workspace actions are not available.';
  if (action.type === 'showPrimary') {
    wsActions.showPrimary();
    return null;
  }
  if (action.type === 'closeItem') {
    return wsActions.closeItem(action.itemId) ? null : 'That tab is not open.';
  }

  const opened = wsActions.openItem(action.itemId);
  const revealed = useExplorerContract.getState().actions?.revealItem(action.itemId) ?? false;
  if (!opened && !revealed) return 'Could not open that item.';
  return null;
}
