// ─────────────────────────────────────────────────────────────
// Vertical stack of sections with draggable & keyboard-accessible
// dividers.
//   • Hidden sections stay mounted via <Activity> so state survives toggling.
//   • Pointer drags update `flexGrow` + `aria-valuenow` directly via DOM refs
//     (zero React renders during 60–120 Hz pointer movement; one commit on pointerup).
// ─────────────────────────────────────────────────────────────
import { Activity, useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

export interface StackSection {
  id: string;
  title?: string;
  visible: boolean;
  header: ReactNode;
  body: ReactNode;
}

interface Props {
  sections: readonly StackSection[];
  sizes: Readonly<Record<string, number>>;
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
  const panels = useRef(new Map<string, HTMLElement>());
  const bodies = useRef(new Map<string, HTMLDivElement>());
  const wasVisible = useRef<Set<string> | null>(null);
  const dragRef = useRef<DragState | null>(null);

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
    const total = d.startA + d.startB;
    const delta = (e.clientY - d.startY) / d.pxPerUnit;
    const na = Math.max(MIN, Math.min(total - MIN, d.startA + delta));
    const nb = total - na;
    d.latest = { [d.a]: na, [d.b]: nb };

    const panelA = panels.current.get(d.a);
    const panelB = panels.current.get(d.b);
    if (panelA) panelA.style.flexGrow = String(na);
    if (panelB) panelB.style.flexGrow = String(nb);
    e.currentTarget.setAttribute('aria-valuenow', String(Math.round((na / total) * 100)));
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>, commit: boolean) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;

    if (commit && d.latest) {
      onResize(d.latest);
      return;
    }
    // Cancelled drag: restore committed sizes on DOM nodes.
    const panelA = panels.current.get(d.a);
    const panelB = panels.current.get(d.b);
    if (panelA) panelA.style.flexGrow = String(d.startA);
    if (panelB) panelB.style.flexGrow = String(d.startB);
    e.currentTarget.setAttribute('aria-valuenow', String(Math.round((d.startA / (d.startA + d.startB)) * 100)));
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
        const aboveSize = above ? (sizes[above.id] ?? 1) : 1;
        const curSize = sizes[s.id] ?? 1;
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
            <StackPanel
              id={s.id}
              size={curSize}
              header={s.header}
              body={s.body}
              panelsRef={panels}
              bodiesRef={bodies}
            />
          </Activity>
        );
      })}
    </div>
  );
}

function StackPanel({
  id,
  size,
  header,
  body,
  panelsRef,
  bodiesRef,
}: {
  id: string;
  size: number;
  header: ReactNode;
  body: ReactNode;
  panelsRef: { current: Map<string, HTMLElement> };
  bodiesRef: { current: Map<string, HTMLDivElement> };
}) {
  return (
    <section
      className="panel"
      style={{ flexGrow: size }}
      ref={(el) => {
        if (el) panelsRef.current.set(id, el);
        return () => {
          panelsRef.current.delete(id);
        };
      }}
    >
      <header className="panel-head">{header}</header>
      <div
        className="panel-body"
        ref={(el) => {
          if (el) bodiesRef.current.set(id, el);
          return () => {
            bodiesRef.current.delete(id);
          };
        }}
      >
        {body}
      </div>
    </section>
  );
}
