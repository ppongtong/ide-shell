// ─────────────────────────────────────────────────────────────
// React 19 Actions: <form action>, useActionState for the result
// and errors, useFormStatus for the pending submit button.
// ─────────────────────────────────────────────────────────────
import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from '@tanstack/react-router';
import type { DialogProps } from '@/lib/plugin-system';
import { workspacesApi } from '../api/workspaces';

type Result = { error?: string; name?: string; description?: string };

export default function NewWorkspaceDialog({ close }: DialogProps) {
  const router = useRouter();
  const nameId = useId();
  const descId = useId();
  const errId = useId();

  const [state, formAction] = useActionState<Result, FormData>(async (_prev, form) => {
    const name = String(form.get('name') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    if (!name) return { error: 'Give the workspace a name.', name, description };

    try {
      const ws = await workspacesApi.create(name, description);
      await router.invalidate(); // reload the workspace list in the parent /workspaces loader
      await router.navigate({
        to: '/workspaces/$wsId',
        params: { wsId: ws.id },
        search: (prev) => ({ ...prev, item: undefined }),
      });
      close();
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Could not create workspace.',
        name,
        description,
      };
    }
  }, {});

  return (
    <form className="form" action={formAction}>
      <h2>New workspace</h2>
      <div className="field">
        <label htmlFor={nameId}>Name</label>
        {/* defaultValue keeps what was typed if validation fails (forms reset after an action) */}
        <input
          id={nameId}
          name="name"
          autoFocus
          defaultValue={state.name}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errId : undefined}
        />
      </div>
      {state.error && <p id={errId} className="error" role="alert">{state.error}</p>}
      <div className="field">
        <label htmlFor={descId}>
          <span>Description <span className="hint">(optional)</span></span>
        </label>
        <input id={descId} name="description" defaultValue={state.description} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={close}>Cancel</button>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus(); // reads the parent <form>'s action state
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Creating…' : 'Create'}
    </button>
  );
}
