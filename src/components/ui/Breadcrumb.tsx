// Breadcrumb building blocks. Routes and features compose them.
import type { ReactNode } from 'react';

export const CrumbSep = () => <span className="sep" aria-hidden>›</span>;

export function CrumbText({ children }: { children: ReactNode }) {
  return <span className="crumb current" aria-current="location">{children}</span>;
}

export function CrumbButton({ children, onClick }: { children: ReactNode; onClick(): void }) {
  return <button className="crumb" onClick={onClick}>{children}</button>;
}
