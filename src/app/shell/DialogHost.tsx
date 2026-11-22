// One host for every activity dialog (action kind 'dialog').
import { Suspense, useRef } from 'react';
import { useRegistry } from '@/lib/plugin-system';
import { Modal } from '@/components/ui/Modal';
import { useShell } from '@/stores/shell-store';

export function DialogHost() {
  const registry = useRegistry();
  const openId = useShell((s) => s.openDialog);
  const hideDialog = useShell((s) => s.hideDialog);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activity = openId ? registry.activity.get(openId) : undefined;
  if (activity?.action.kind !== 'dialog') return null;
  const Dialog = activity.action.dialog;

  const close = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    else hideDialog();
  };

  return (
    <Modal ref={dialogRef} label={activity.title} onClose={hideDialog}>
      <Suspense fallback={<div className="empty">Loading…</div>}>
        {/* close() → native close → onClose → store cleared → unmounted */}
        <Dialog close={close} />
      </Suspense>
    </Modal>
  );
}
