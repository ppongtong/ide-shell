// ─────────────────────────────────────────────────────────────
// Mock agent. Swap for your real agent endpoint.
// It gets the workspace snapshot with each question, and its reply
// can ask the UI to act. For the demo it understands
// "open <item>" and "close <item>".
// ─────────────────────────────────────────────────────────────
import type { WorkspaceActions, WorkspaceSnapshot } from '@/stores/workspace-bridge';

/** Something the reply asks the UI to do; the panel runs it through the bridge's actions. */
export interface AgentAction {
  type: keyof WorkspaceActions;
  itemId: string;
}

export interface AgentReply {
  text: string;
  actions: AgentAction[];
}

export const agentApi = {
  ask: (question: string, context: WorkspaceSnapshot | null) =>
    new Promise<AgentReply>((resolve) => setTimeout(() => resolve(reply(question, context)), 600)),
};

function reply(question: string, ctx: WorkspaceSnapshot | null): AgentReply {
  if (!ctx) return { text: '(demo) Open a workspace first.', actions: [] };

  const command = /^(open|close)\s+(.+)$/i.exec(question.trim());
  if (command) {
    const [, verb = '', name = ''] = command;
    const wanted = name.toLowerCase();
    const item = ctx.workspace.items.find((i) => i.name.toLowerCase() === wanted || i.id === wanted);
    if (!item) return { text: `(demo) There's no “${name}” in ${ctx.workspace.name}.`, actions: [] };
    const open = verb.toLowerCase() === 'open';
    return {
      text: `(demo) ${open ? 'Opening' : 'Closing'} ${item.name}.`,
      actions: [{ type: open ? 'openItem' : 'closeItem', itemId: item.id }],
    };
  }

  const where = ctx.activeItem ? `${ctx.activeItem.name} in ${ctx.workspace.name}` : ctx.workspace.name;
  return {
    text: `(demo) I'd look at ${where} to answer “${question}”. Try “open <name>” or “close <name>”.`,
    actions: [],
  };
}
