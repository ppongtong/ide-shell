// Lightweight dialog to create a workspace (Name + optional Description).
// Once created, navigates straight to `/workspaces/$wsId`, where the pinned
// `type: 'primary'` plugin renders its primary-key selector.
import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from '@tanstack/react-router';
import type { DialogProps } from '@/lib/plugin-system';
import { workspacesApi } from '../api/workspaces';

interface FormState {
  readonly error?: string;
  readonly draftName?: string;
  readonly draftDescription?: string;
}

export default function NewWorkspaceDialog({ close }: DialogProps) {
  const router = useRouter();
  const nameId = useId();
  const descId = useId();
  const errId = useId();

  const [state, formAction] = useActionState<FormState, FormData>(async (_prev, form) => {
    const rawName = String(form.get('name') ?? '');
    const rawDesc = String(form.get('description') ?? '');
    const name = rawName.trim();
    const description = rawDesc.trim();

    if (!name) {
      return { error: 'Workspace name is required.', draftName: rawName, draftDescription: rawDesc };
    }

    try {
      const ws = await workspacesApi.create({ name, description });
      await router.invalidate();
      close();
      await router.navigate({ to: '/workspaces/$wsId', params: { wsId: ws.id } });
      return {};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Could not create workspace.',
        draftName: name,
        draftDescription: description,
      };
    }
  }, {});

  return (
    <form className="form" action={formAction}>
      <h2>New workspace</h2>

      {state.error && (
        <p id={errId} className="error" role="alert">
          {state.error}
        </p>
      )}

      <div className="field">
        <label htmlFor={nameId}>
          Name <span className="req" aria-hidden="true">*</span>
        </label>
        <input
          id={nameId}
          name="name"
          required
          autoFocus
          defaultValue={state.draftName ?? ''}
          placeholder="e.g. Storefront v2"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errId : undefined}
        />
      </div>

      <div className="field">
        <label htmlFor={descId}>
          <span>
            Description <span className="hint">(optional)</span>
          </span>
        </label>
        <input
          id={descId}
          name="description"
          defaultValue={state.draftDescription ?? ''}
          placeholder="Short summary of this workspace"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={close}>
          Cancel
        </button>
        <CreateButton />
      </div>
    </form>
  );
}

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Creating…' : 'Create'}
    </button>
  );
}
