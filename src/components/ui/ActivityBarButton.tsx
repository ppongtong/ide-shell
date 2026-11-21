// Pure visual button. Knows nothing about plugins or routes.
import type { ComponentType } from 'react';

export type ActivityButtonState = 'selected' | 'on' | 'off';

interface Props {
  title: string;
  icon: ComponentType<{ size?: number | string }>;
  state: ActivityButtonState;
  disabled?: boolean;
  disabledReason?: string;
  /** 'toggle' → aria-pressed; 'dialog' → aria-haspopup */
  role?: 'link' | 'toggle' | 'dialog';
  onClick(): void;
}

export function ActivityBarButton({ title, icon: Icon, state, disabled, disabledReason, role, onClick }: Props) {
  return (
    <button
      className={`act ${state}`}
      title={disabled && disabledReason ? `${title} (${disabledReason})` : title}
      aria-label={title}
      aria-pressed={role === 'toggle' ? state === 'on' : undefined}
      aria-current={state === 'selected' ? 'page' : undefined}
      aria-haspopup={role === 'dialog' ? 'dialog' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={22} />
    </button>
  );
}
