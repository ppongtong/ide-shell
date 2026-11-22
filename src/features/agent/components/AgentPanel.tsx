// ─────────────────────────────────────────────────────────────
// Agent chat (`core.agent`).
//   • Selects narrow primitive slices (`wsId`, `wsName`, `activeName`) from
//     `@/features/workspace/contract`, so opening/closing background tabs
//     never triggers a re-render.
//   • Executes reply actions through `@/features/workspace/contract` and
//     `@/features/explorer/contract` using `.getState()` before & after `await`.
// ─────────────────────────────────────────────────────────────
import {
  startTransition,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  ViewTransition,
  type FormEvent,
} from 'react';
import { Send } from 'lucide-react';
import { useWorkspaceContract, type WorkspaceSnapshot } from '@/features/workspace/contract';
import { useExplorerContract } from '@/features/explorer/contract';
import { agentApi, type AgentAction } from '../api/agent';

interface Msg {
  id: string;
  from: 'you' | 'agent';
  text: string;
  pending?: boolean;
}

const EMPTY_MSGS: readonly Msg[] = Object.freeze([]);

function runReplyAction(action: AgentAction): boolean {
  if (action.target === 'explorer') {
    const explorerActions = useExplorerContract.getState().actions;
    return explorerActions ? explorerActions[action.type]() : false;
  }
  const wsActions = useWorkspaceContract.getState().actions;
  if (!wsActions) return false;
  if (action.type === 'showDetails') return wsActions.showDetails();
  return wsActions[action.type](action.itemId);
}

async function askAndApply(text: string, asked: WorkspaceSnapshot | null): Promise<string> {
  let reply;
  try {
    reply = await agentApi.ask(text, asked);
  } catch (err) {
    return err instanceof Error ? `Error: ${err.message}` : 'Could not reach the agent.';
  }

  let answer = reply.text;
  if (reply.actions.length > 0) {
    const nowWsId = useWorkspaceContract.getState().current?.workspace?.id;
    if (!asked?.workspace || nowWsId !== asked.workspace.id) {
      answer += ' Skipped: you left that workspace.';
    } else {
      for (const action of reply.actions) {
        if (!runReplyAction(action)) answer += ` (${action.type} did nothing.)`;
      }
    }
  }
  return answer;
}

export default function AgentPanel() {
  const wsId = useWorkspaceContract((s) => s.current?.workspace?.id);
  const wsName = useWorkspaceContract((s) => s.current?.workspace?.name);
  const activeName = useWorkspaceContract((s) => s.current?.activeItem?.name);
  const wsKey = wsId ?? '_none';

  const [history, setHistory] = useState<Record<string, Msg[]>>({});
  const messages = history[wsKey] ?? EMPTY_MSGS;
  const [shown, addOptimistic] = useOptimistic(messages, (cur, m: Msg) => [...cur, m]);
  const [isPending, startSending] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement | null;
    const text = input?.value.trim() ?? '';
    if (!text || isPending) return;
    if (input) input.value = '';

    const asked = useWorkspaceContract.getState().current;
    const targetWs = asked?.workspace?.id ?? '_none';
    const mine: Msg = { id: crypto.randomUUID(), from: 'you', text };

    startSending(async () => {
      addOptimistic({ ...mine, pending: true });
      const answer = await askAndApply(text, asked);
      startTransition(() => {
        setHistory((prev) => ({
          ...prev,
          [targetWs]: [...(prev[targetWs] ?? []), mine, { id: crypto.randomUUID(), from: 'agent', text: answer }],
        }));
      });
    });
  }

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [wsKey, shown.length]);

  return (
    <div className="agent-panel">
      <div className="agent-ctx">
        {wsName ? (
          <>
            Context: <strong>{wsName}</strong>
            {activeName && <> › <strong>{activeName}</strong></>}
          </>
        ) : (
          'No workspace open'
        )}
      </div>
      <div className="agent-msgs" aria-live="polite">
        {shown.length === 0 && (
          <p className="hint">
            {`Ask about ${activeName ?? 'this workspace'}, or try “open <name>”, “close <name>”, or “collapse all”.`}
          </p>
        )}
        {shown.map((m) => (
          <ViewTransition key={m.id} enter="msg-enter" default="none">
            <p className={`msg ${m.from}`}>{m.text}</p>
          </ViewTransition>
        ))}
        {shown.at(-1)?.pending && <p className="msg thinking">Agent is thinking…</p>}
        <div ref={end} />
      </div>
      <form className="agent-input" onSubmit={onSubmit}>
        <input
          name="q"
          autoComplete="off"
          placeholder={activeName ? `Ask about ${activeName}` : 'Ask the agent'}
          aria-label="Message the agent"
        />
        <button type="submit" className="icon-btn" aria-label="Send" disabled={isPending}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
