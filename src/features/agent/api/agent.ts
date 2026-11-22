// ─────────────────────────────────────────────────────────────
// Mock agent. Swap for your real agent endpoint.
// Consumes public contracts from BOTH `workspace` and `explorer`
// without importing either feature's internal implementation.
// Understands: "open <item>", "close <item>", "collapse all", "expand all".
// ─────────────────────────────────────────────────────────────
import type { WorkspaceSnapshot } from '@/features/workspace/contract';

export type AgentAction =
  | { readonly target: 'workspace'; readonly type: 'openItem' | 'closeItem'; readonly itemId: string }
  | { readonly target: 'workspace'; readonly type: 'showDetails' }
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
    const open = verb.toLowerCase() === 'open';
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
