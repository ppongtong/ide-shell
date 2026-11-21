// ─────────────────────────────────────────────────────────────
// Vertical stack of sections with draggable & keyboard-accessible
// dividers. Hidden sections stay mounted via <Activity> so state
// (e.g. agent chat) survives toggling panels off and on.
// ─────────────────────────────────────────────────────────────
import { Activity, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

export interface StackSection {
  id: string;
  title?: string;
  visible: boolean;
  header: ReactNode;
  body: ReactNode;
}

interface Props {
  sections: StackSection[];
  sizes: Record<string, number>;
  onResize(sizes: Record<string, number>): void;
  /** Move focus into a section when it goes from hidden to visible. */
  focusOnShow?: boolean;
}

interface DragState {
  pointerId: number;
  startY: number;
  pxPerUnit: number;
  a: string;
  b: string;
  startA: number;
  startB: number;
  latest: Record<string, number> | null;
}

const MIN = 0.15;
const KEY_STEP = 0.1;
const DIVIDER_HEIGHT = 5;

export function ResizableStack({ sections, sizes, onResize, focusOnShow }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const bodies = useRef(new Map<string, HTMLDivElement>());
  const wasVisible = useRef<Set<string> | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragSizes, setDragSizes] = useState<Record<string, number> | null>(null);

  const activeSizes = dragSizes ?? sizes;
  const visible = sections.filter((s) => s.visible);
  const visibleKey = visible.map((s) => s.id).join('\0');

  // Focus a section's first interactive control when newly shown (not on first mount).
  useEffect(() => {
    const now = new Set(visibleKey ? visibleKey.split('\0') : []);
    if (focusOnShow && wasVisible.current) {
      for (const id of now) {
        if (!wasVisible.current.has(id)) {
          bodies.current
            .get(id)
            ?.querySelector<HTMLElement>('input, select, textarea, button, [tabindex]:not([tabindex="-1"])')
            ?.focus();
        }
      }
    }
    wasVisible.current = now;
  }, [focusOnShow, visibleKey]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>, a: string, b: string) {
    const el = box.current;
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const totalUnits = visible.reduce((n, s) => n + (sizes[s.id] ?? 1), 0);
    const availablePx = Math.max(1, el.clientHeight - Math.max(0, visible.length - 1) * DIVIDER_HEIGHT);
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      pxPerUnit: availablePx / totalUnits,
      a,
      b,
      startA: sizes[a] ?? 1,
      startB: sizes[b] ?? 1,
      latest: null,
    };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const delta = (e.clientY - d.startY) / d.pxPerUnit;
    const na = Math.max(MIN, Math.min(d.startA + d.startB - MIN, d.startA + delta));
    const next = { [d.a]: na, [d.b]: d.startA + d.startB - na };
    d.latest = next;
    setDragSizes(next);
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>, commit: boolean) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragSizes(null);
    if (commit && d.latest) onResize(d.latest);
  }

  function onSeparatorKeyDown(e: KeyboardEvent<HTMLDivElement>, a: string, b: string) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const curA = sizes[a] ?? 1;
    const curB = sizes[b] ?? 1;
    const total = curA + curB;
    const delta = (e.key === 'ArrowDown' ? 1 : -1) * total * KEY_STEP;
    const na = Math.max(MIN, Math.min(total - MIN, curA + delta));
    onResize({ [a]: na, [b]: total - na });
  }

  return (
    <div className="stack" ref={box}>
      {sections.map((s) => {
        const i = visible.indexOf(s);
        const above = i > 0 ? visible[i - 1] : undefined;
        const aboveSize = above ? (activeSizes[above.id] ?? 1) : 1;
        const curSize = activeSizes[s.id] ?? 1;
        const ratioPercent = Math.round((aboveSize / (aboveSize + curSize)) * 100);

        return (
          <Activity key={s.id} mode={s.visible ? 'visible' : 'hidden'}>
            {above && (
              <div
                className="divider"
                role="separator"
                tabIndex={0}
                aria-orientation="horizontal"
                aria-label={`Resize ${above.title ?? above.id} and ${s.title ?? s.id}`}
                aria-valuemin={15}
                aria-valuemax={85}
                aria-valuenow={ratioPercent}
                onPointerDown={(e) => onPointerDown(e, above.id, s.id)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => finishDrag(e, true)}
                onPointerCancel={(e) => finishDrag(e, false)}
                onKeyDown={(e) => onSeparatorKeyDown(e, above.id, s.id)}
              />
            )}
            <section className="panel" style={{ flexGrow: curSize }}>
              <header className="panel-head">{s.header}</header>
              <div
                className="panel-body"
                ref={(el) => {
                  if (el) bodies.current.set(s.id, el);
                  return () => {
                    bodies.current.delete(s.id);
                  };
                }}
              >
                {s.body}
              </div>
            </section>
          </Activity>
        );
      })}
    </div>
  );
}
