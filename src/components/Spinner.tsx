import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-brand-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Spinner size={32} />
      <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-8 w-28 rounded-lg" />
    </div>
  );
}
