// ─────────────────────────────────────────────────────────────
// Pinned first tab inside every workspace (both draft /workspaces/new
// and saved /workspaces/$wsId).
//   • Draft mode: collects required fields (Name + Primary Type) and
//     creates the workspace seeded with its primary root node.
//   • Saved mode: Primary Type is locked; Name & Description can be updated.
// ─────────────────────────────────────────────────────────────
import { useActionState, useId, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from '@tanstack/react-router';
import { KeyRound, Lock } from 'lucide-react';
import { PRIMARY_TYPES, workspacesApi, type Workspace } from '../api/workspaces';

interface FormResult {
  readonly error?: string;
  readonly saved?: boolean;
  readonly draftName?: string;
  readonly draftDescription?: string;
}

export function WorkspaceDetailsTab({ workspace }: { workspace: Workspace | null }) {
  const isDraft = workspace === null;
  const router = useRouter();
  const nameId = useId();
  const primaryId = useId();
  const primaryHintId = useId();
  const descId = useId();
  const errId = useId();

  const [selectedPrimary, setSelectedPrimary] = useState(workspace?.primaryType ?? PRIMARY_TYPES[0]?.id ?? '');
  const activePreset = PRIMARY_TYPES.find((p) => p.id === (workspace?.primaryType ?? selectedPrimary));

  const [state, formAction] = useActionState<FormResult, FormData>(async (_prev, form) => {
    const rawName = String(form.get('name') ?? '');
    const rawDesc = String(form.get('description') ?? '');
    const name = rawName.trim();
    const description = rawDesc.trim();
    const primaryType = String(form.get('primaryType') ?? selectedPrimary).trim();

    if (!name) {
      return {
        error: 'Workspace name is required.',
        draftName: isDraft ? rawName : undefined,
        draftDescription: rawDesc,
      };
    }
    if (isDraft && !primaryType) {
      return {
        error: 'Choose a primary type to initialize the workspace.',
        draftName: name,
        draftDescription: description,
      };
    }

    try {
      if (isDraft) {
        const ws = await workspacesApi.create({ name, primaryType, description });
        await router.invalidate();
        await router.navigate({
          to: '/workspaces/$wsId',
          params: { wsId: ws.id },
          replace: true, // Back skips the empty creation form
        });
        return {};
      }

      await workspacesApi.update(workspace.id, { name, description });
      await router.invalidate();
      return { saved: true };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Could not save workspace details.',
        draftName: name,
        draftDescription: description,
      };
    }
  }, {});

  const defaultName = state.draftName ?? workspace?.name ?? '';
  const defaultDesc = state.draftDescription ?? workspace?.description ?? '';

  return (
    <div className="details-tab">
      <form className="form details-form" action={formAction}>
        <div className="details-head">
          <h1>{isDraft ? 'New workspace' : workspace.name}</h1>
          <p className="hint">
            {isDraft
              ? 'Complete the required fields below to create this workspace and seed its primary root node.'
              : 'Pinned workspace details. Primary type is locked after creation.'}
          </p>
        </div>

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
            autoFocus={isDraft}
            defaultValue={defaultName}
            placeholder="e.g. Storefront v2"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errId : undefined}
          />
        </div>

        <div className="field">
          <label htmlFor={primaryId}>
            Primary type {isDraft && <span className="req" aria-hidden="true">*</span>}
          </label>
          {isDraft ? (
            <>
              <p id={primaryHintId} className="hint field-hint">
                Creates the primary root node pinned at the top of the Explorer (locked after creation).
              </p>
              <select
                id={primaryId}
                name="primaryType"
                required
                value={selectedPrimary}
                aria-describedby={primaryHintId}
                onChange={(e) => setSelectedPrimary(e.target.value)}
              >
                {PRIMARY_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div id={primaryId} className="locked-field" aria-readonly="true">
              <KeyRound size={14} aria-hidden="true" />
              <span>{activePreset?.label ?? workspace.primaryType}</span>
              <span className="locked-badge">
                <Lock size={11} aria-hidden="true" /> Locked
              </span>
            </div>
          )}

          {activePreset && (
            <div className="primary-preview">
              <p className="hint">{activePreset.description}</p>
              <p className="preview-root">
                <KeyRound size={13} aria-hidden="true" />
                <strong>{activePreset.rootName}</strong>
              </p>
              <ul className="preview-children" role="list">
                {activePreset.children.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>
            </div>
          )}
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
            defaultValue={defaultDesc}
            placeholder="Short summary of this workspace"
          />
        </div>

        <div className="form-actions">
          {state.saved && (
            <span className="save-ok" role="status">
              Saved
            </span>
          )}
          {isDraft && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => void router.navigate({ to: '/workspaces' })}
            >
              Cancel
            </button>
          )}
          <SubmitButton isDraft={isDraft} />
        </div>
      </form>
    </div>
  );
}

function SubmitButton({ isDraft }: { isDraft: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? (isDraft ? 'Creating…' : 'Saving…') : isDraft ? 'Create workspace' : 'Save changes'}
    </button>
  );
}
