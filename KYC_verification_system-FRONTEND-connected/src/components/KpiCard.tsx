import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendUp,
}: KpiCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-1">
            {value}
          </p>
        </div>
        <div
          className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
      </div>
      {trend && (
        <p
          className={`text-xs mt-2 ${
            trendUp
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-ink-400 dark:text-ink-500'
          }`}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
