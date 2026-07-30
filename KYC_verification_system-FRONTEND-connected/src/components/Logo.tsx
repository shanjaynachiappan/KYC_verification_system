import { ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 'h-7 w-7', text: 'text-base', radius: 'rounded-lg' },
  md: { icon: 'h-9 w-9', text: 'text-lg', radius: 'rounded-xl' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl', radius: 'rounded-2xl' },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${s.icon} ${s.radius} bg-brand-600 flex items-center justify-center shadow-sm`}
      >
        <ShieldCheck className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight text-ink-900 dark:text-ink-50`}>
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
