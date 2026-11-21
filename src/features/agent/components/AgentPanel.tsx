// ─────────────────────────────────────────────────────────────
// Agent chat. React 19.x features:
//   • useTransition + useOptimistic: your message shows instantly while
//     clearing the input immediately so follow-up typing isn't wiped
//   • <ViewTransition> (19.3): each new message animates in
//   • Per-workspace message history so switching workspaces isolates chats
// The workspace (what's open + actions to change it) comes from the
// bridge store, so send() reads where the user is both before and after await.
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
import { useWorkspaceBridge } from '@/stores/workspace-bridge';
import { agentApi } from '../api/agent';
import { BridgeDemo } from './BridgeDemo';

interface Msg {
  id: string;
  from: 'you' | 'agent';
  text: string;
  pending?: boolean;
}

const EMPTY_MSGS: Msg[] = [];

export default function AgentPanel() {
  const current = useWorkspaceBridge((s) => s.current);
  const wsKey = current?.workspace.id ?? '_none';
  const activeName = current?.activeItem?.name;

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

    const asked = useWorkspaceBridge.getState().current;
    const targetWs = asked?.workspace.id ?? '_none';
    const mine: Msg = { id: crypto.randomUUID(), from: 'you', text };

    startSending(async () => {
      addOptimistic({ ...mine, pending: true });
      let answer: string;
      try {
        const reply = await agentApi.ask(text, asked);
        const { current: now, actions } = useWorkspaceBridge.getState();
        answer = reply.text;
        if (reply.actions.length) {
          if (!actions || now?.workspace.id !== asked?.workspace.id) {
            answer += ' Skipped: you left that workspace.';
          } else {
            for (const a of reply.actions) {
              if (!actions[a.type](a.itemId)) answer += ` (${a.type} did nothing.)`;
            }
          }
        }
      } catch (err) {
        answer = err instanceof Error ? `Error: ${err.message}` : 'Could not reach the agent.';
      }

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
        {current ? (
          <>
            Context: <strong>{current.workspace.name}</strong>
            {activeName && <> › <strong>{activeName}</strong></>}
          </>
        ) : (
          'No workspace open'
        )}
      </div>
      <BridgeDemo />
      <div className="agent-msgs" aria-live="polite">
        {shown.length === 0 && (
          <p className="hint">{`Ask about ${activeName ?? 'this workspace'}, or try “open <name>” / “close <name>”.`}</p>
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
