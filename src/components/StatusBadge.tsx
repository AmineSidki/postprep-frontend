import type { ArticleStatus } from '../types';
import { cn } from '../lib/cn';

const META: Record<ArticleStatus, { label: string; cls: string; dot: string }> = {
  PROCESSING: { label: 'Processing', cls: 'border-amber-300/25 bg-amber-300/10 text-amber-200', dot: 'bg-amber-300 animate-pulse' },
  PROCESSED: { label: 'Processed', cls: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200', dot: 'bg-emerald-300' },
  INTERRUPTED: { label: 'Interrupted', cls: 'border-rose-300/25 bg-rose-300/10 text-rose-200', dot: 'bg-rose-300' },
};

export const STATUS_FILTERS: { value: 'ALL' | ArticleStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'INTERRUPTED', label: 'Interrupted' },
];

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const meta = META[status] ?? META.INTERRUPTED;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', meta.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
