import type { VerificationStatus, Priority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants';

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`badge ${config.badgeClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : ''
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dotClass} ${
          status === 'processing' ? 'animate-pulse' : ''
        }`}
      />
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`badge ${config.badgeClass} text-[11px] px-2 py-0.5`}>
      {config.label}
    </span>
  );
}
