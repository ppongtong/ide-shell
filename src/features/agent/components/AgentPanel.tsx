// ─────────────────────────────────────────────────────────────
// Agent chat (`core.agent`).
//   • Selects narrow primitive slices (`wsId`, `wsName`, `activeName`) from
//     `@/features/workspace/contract`, so opening/closing background tabs
//     never triggers a re-render.
//   • Checks `wsActions.isActiveWorkspace(wsId)` after `await` — zero route
//     path knowledge inside the agent feature.
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
import { EMPTY } from '@/lib/plugin-system';
import { useWorkspaceContract, type WorkspaceSnapshot } from '@/features/workspace/contract';
import { agentApi, runAgentAction } from '../api/agent';

interface Msg {
  id: string;
  from: 'you' | 'agent';
  text: string;
  pending?: boolean;
}

let nextMsgSeq = 0;
const nextMsgId = () => `msg-${++nextMsgSeq}`;

async function askAndApply(text: string, asked: WorkspaceSnapshot | null): Promise<string> {
  let reply;
  try {
    reply = await agentApi.ask(text, asked);
  } catch (err) {
    return err instanceof Error ? `Error: ${err.message}` : 'Could not reach the agent.';
  }

  let answer = reply.text;
  if (reply.actions.length > 0) {
    const askedWs = asked?.workspace;
    const wsActions = useWorkspaceContract.getState().actions;
    if (!askedWs || !wsActions?.isActiveWorkspace(askedWs.id)) {
      return `${answer} Skipped: you left that workspace.`;
    }
    for (const action of reply.actions) {
      const note = runAgentAction(action);
      if (note) answer += ` (${note})`;
    }
  }
  return answer;
}

export default function AgentPanel() {
  const wsId = useWorkspaceContract((s) => s.current?.workspace?.id);
  const wsName = useWorkspaceContract((s) => s.current?.workspace?.name);
  const primaryId = useWorkspaceContract((s) => s.current?.primaryItem?.id);
  const primaryName = useWorkspaceContract((s) => s.current?.primaryItem?.name);
  const activeName = useWorkspaceContract((s) => s.current?.activeItem?.name);
  const wsKey = wsId ?? '_none';

  const [history, setHistory] = useState<Record<string, readonly Msg[]>>({});
  const [optimisticHistory, addOptimistic] = useOptimistic(
    history,
    (cur, entry: { ws: string; msg: Msg }) => ({
      ...cur,
      [entry.ws]: [...(cur[entry.ws] ?? EMPTY), entry.msg],
    }),
  );
  const shown = optimisticHistory[wsKey] ?? EMPTY;
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
    const mine: Msg = { id: nextMsgId(), from: 'you', text };

    startSending(async () => {
      addOptimistic({ ws: targetWs, msg: { ...mine, pending: true } });
      const answer = await askAndApply(text, asked);
      startTransition(() => {
        setHistory((prev) => ({
          ...prev,
          [targetWs]: [...(prev[targetWs] ?? EMPTY), mine, { id: nextMsgId(), from: 'agent', text: answer }],
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
            <div>
              Context: <strong>{wsName}</strong>
              {activeName && <> › <strong>{activeName}</strong></>}
            </div>
            <div>
              Primary:{' '}
              {primaryName && primaryId ? (
                <>
                  <strong>{primaryName}</strong> <code>{primaryId}</code>
                </>
              ) : (
                <span>Not selected</span>
              )}
            </div>
          </>
        ) : (
          'No workspace open'
        )}
      </div>
      <div className="agent-msgs" aria-live="polite">
        {shown.length === 0 && (
          <p className="hint">
            {`Ask about ${activeName ?? primaryName ?? 'this workspace'}, or try “primary key”, “open <name>”, “close <name>”, or “collapse all”.`}
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
