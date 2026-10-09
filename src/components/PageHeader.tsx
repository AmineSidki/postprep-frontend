import type { ReactNode } from 'react';
import { todayLabel } from '../lib/format';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <p className="eyebrow">{todayLabel()}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl italic text-slate-400">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
