// ─────────────────────────────────────────────────────────────
// Pluggable renderer for `type: 'primary'` (pinned first tab).
//   • `item === undefined` (new workspace): renders PrimaryKeySelector
//     and signals selection via `workspace/contract` (`setPrimaryItem`).
//   • `item !== undefined` (configured workspace): renders PrimaryKeyDetail.
// Workspace and Explorer never know what is rendered inside this tab.
// ─────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react';
import { Database, KeyRound, Lock } from 'lucide-react';
import type { Item, ItemRendererProps, WorkspaceInfo } from '@/lib/plugin-system';
import { useWorkspaceContract, type PrimaryChildSeed } from '@/features/workspace/contract';

interface PrimaryKeyOption {
  readonly key: string;
  readonly name: string;
  readonly source: string;
  readonly description: string;
  readonly children: readonly PrimaryChildSeed[];
}

interface PrimaryMetadata {
  readonly key?: string;
  readonly source?: string;
  readonly description?: string;
}

const CATALOG: readonly PrimaryKeyOption[] = [
  {
    key: 'storefront-core',
    name: 'Storefront Core',
    source: 'commerce.orders_v2',
    description: 'Customer-facing web storefront, checkout flow, and product catalog.',
    children: [
      {
        id: 'checkout',
        type: 'file',
        name: 'checkout.ts',
        content: 'export function calculateTotal(prices: number[]) {\n  return prices.reduce((a, b) => a + b, 0);\n}\n',
      },
      {
        id: 'catalog',
        type: 'dataset',
        name: 'catalog.csv',
        content: 'sku,name,price\nSKU-1,Keyboard,120\nSKU-2,Monitor,380\n',
      },
    ],
  },
  {
    key: 'analytics-pipeline',
    name: 'Pipeline Root',
    source: 'warehouse.events_daily',
    description: 'Event ingestion pipeline and daily KPI metric definitions.',
    children: [
      {
        id: 'ingest',
        type: 'file',
        name: 'ingest.ts',
        content: 'export async function ingestEvents(source: string) {\n  return `Synced ${source}`;\n}\n',
      },
      {
        id: 'metrics',
        type: 'dataset',
        name: 'metrics.csv',
        content: 'metric,target\nconversion,4.5%\nretention,82%\n',
      },
    ],
  },
  {
    key: 'ops-console',
    name: 'Ops Console',
    source: 'iam.role_bindings',
    description: 'Internal operations console and access-control rules.',
    children: [
      {
        id: 'admin',
        type: 'file',
        name: 'admin.ts',
        content: 'export const roles = ["admin", "editor", "viewer"] as const;\n',
      },
      {
        id: 'permissions',
        type: 'dataset',
        name: 'permissions.csv',
        content: 'role,canDeploy\nadmin,true\neditor,false\n',
      },
    ],
  },
];

function parseMetadata(raw: string | undefined): PrimaryMetadata {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed as PrimaryMetadata;
  } catch {
    /* Plain-text or empty content */
  }
  return {};
}

async function applyPrimaryOption(chosen: PrimaryKeyOption): Promise<string | null> {
  try {
    const actions = useWorkspaceContract.getState().actions;
    const ok = actions
      ? await actions.setPrimaryItem({
          name: chosen.name,
          content: JSON.stringify({
            key: chosen.key,
            source: chosen.source,
            description: chosen.description,
          }),
          children: chosen.children,
        })
      : false;
    return ok ? null : 'Could not bind primary key to this workspace.';
  } catch (err) {
    return err instanceof Error ? err.message : 'Could not bind primary key to this workspace.';
  }
}

export default function PrimaryKeyComponent({ workspace, item }: ItemRendererProps) {
  if (!item) {
    return <PrimaryKeySelector workspace={workspace} />;
  }
  return <PrimaryKeyDetail workspace={workspace} item={item} />;
}

function PrimaryKeySelector({ workspace }: { workspace: WorkspaceInfo }) {
  const [selectedKey, setSelectedKey] = useState(CATALOG[0]?.key ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSaving] = useTransition();

  const chosen = CATALOG.find((c) => c.key === selectedKey) ?? CATALOG[0];

  function onConfirm() {
    if (!chosen || isPending) return;
    setError(null);
    startSaving(async () => {
      const errMsg = await applyPrimaryOption(chosen);
      if (errMsg) setError(errMsg);
    });
  }

  return (
    <div className="details-tab">
      <div className="form details-form">
        <div className="details-head">
          <h1>{workspace.name}</h1>
          <p className="hint">
            {workspace.description || 'Select the primary key / data source to initialize this workspace.'}
          </p>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <fieldset className="pk-options">
          <legend className="pk-legend">Select primary key</legend>
          {CATALOG.map((option) => {
            const checked = option.key === chosen?.key;
            return (
              <label key={option.key} className={`pk-card ${checked ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`pk-${workspace.id}`}
                  value={option.key}
                  checked={checked}
                  onChange={() => setSelectedKey(option.key)}
                />
                <div className="pk-card-body">
                  <div className="pk-card-title">
                    <KeyRound size={14} aria-hidden="true" />
                    <strong>{option.name}</strong>
                    <code>{option.source}</code>
                  </div>
                  <p className="hint">{option.description}</p>
                  <ul className="preview-children" role="list">
                    {option.children.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              </label>
            );
          })}
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn" disabled={!chosen || isPending} onClick={onConfirm}>
            {isPending ? 'Applying…' : 'Select primary key'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrimaryKeyDetail({ workspace, item }: { workspace: WorkspaceInfo; item: Item }) {
  const meta = parseMetadata(item.content);
  const children = workspace.items.filter((i) => i.parentId === item.id);

  return (
    <div className="details-tab">
      <div className="details-form form">
        <div className="details-head">
          <h1>{item.name}</h1>
          <p className="hint">{`${workspace.name}${workspace.description ? ` — ${workspace.description}` : ''}`}</p>
        </div>

        <div className="locked-field">
          <KeyRound size={14} aria-hidden="true" />
          <span>{meta.key ?? item.id}</span>
          {meta.source && (
            <span className="pk-source">
              <Database size={12} aria-hidden="true" /> {meta.source}
            </span>
          )}
          <span className="locked-badge">
            <Lock size={11} aria-hidden="true" /> Selected
          </span>
        </div>

        {meta.description && <p className="hint">{meta.description}</p>}

        {children.length > 0 && (
          <div className="primary-preview">
            <p className="hint">Linked primary items</p>
            <ul className="pk-linked-list" role="list">
              {children.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    className="crumb"
                    onClick={() => {
                      useWorkspaceContract.getState().actions?.openItem(child.id);
                    }}
                  >
                    {child.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
