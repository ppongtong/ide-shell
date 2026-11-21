// ─────────────────────────────────────────────────────────────
// Native <dialog> as a modal.
//   • `closedby="any"` gives declarative light-dismiss in modern browsers
//   • Fallback checks pointerdown + dialog bounds for browsers without
//     `closedBy` (e.g. Safari), avoiding accidental dismissal when a user
//     drags to select text inside an input and releases outside.
// ─────────────────────────────────────────────────────────────
import { useRef, type ReactNode, type Ref } from 'react';

interface Props {
  label: string;
  onClose(): void;
  children: ReactNode;
  ref?: Ref<HTMLDialogElement>;
}

export function Modal({ label, onClose, children, ref }: Props) {
  const pointerDownOnDialog = useRef(false);

  return (
    <dialog
      className="modal"
      closedby="any"
      aria-label={label}
      ref={(el) => {
        if (!el) return;
        if (!el.open) el.showModal();
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
        return () => {
          if (typeof ref === 'function') ref(null);
          else if (ref) ref.current = null;
        };
      }}
      onClose={onClose}
      onPointerDown={(e) => {
        pointerDownOnDialog.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const startedOnBackdrop = pointerDownOnDialog.current;
        pointerDownOnDialog.current = false;
        if ('closedBy' in HTMLDialogElement.prototype) return;
        if (!startedOnBackdrop || e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const isDialogContent =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isDialogContent) e.currentTarget.close();
      }}
    >
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
