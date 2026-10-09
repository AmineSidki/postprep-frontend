import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

export const Spinner = ({ size = 18, className }: { size?: number; className?: string }) => (
  <Loader2 size={size} className={cn('animate-spin', className)} aria-hidden />
);

export const PageSpinner = () => (
  <div role="status" aria-label="Loading" className="flex min-h-[40vh] items-center justify-center text-pink-300">
    <Spinner size={28} />
  </div>
);
