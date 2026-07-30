import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle as XCircleIcon,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { SkeletonRow, Spinner } from '../components/Spinner';
import { useDashboardData } from '../hooks/useDashboardData';
import { useVerificationQueue } from '../hooks/useVerificationQueue';
import type { ActivityItem, TrendDataPoint, StatusDistribution, HourlyDataPoint } from '../types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const activityIcons: Record<
  ActivityItem['type'],
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  approved: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  rejected: {
    icon: XCircleIcon,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
  submitted: {
    icon: Upload,
    color: 'text-brand-600 dark:text-brand-400',
    bg: 'bg-brand-50 dark:bg-brand-900/20',
  },
  processing: {
    icon: Loader2,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
  },
};

// ── SVG Area Chart ────────────────────────────────────────────────────────────
interface AreaChartProps {
  data: { label: string; value: number; value2?: number }[];
  color1?: string;
  color2?: string;
  height?: number;
}

function SvgAreaChart({ data, color1 = '#3b82f6', color2 = '#10b981', height = 160 }: AreaChartProps) {
  const W = 480;
  const H = height;
  const pad = { top: 12, right: 12, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.value, d.value2 ?? 0])) * 1.15 || 1;
  const xStep = innerW / Math.max(data.length - 1, 1);

  const toX = (i: number) => pad.left + i * xStep;
  const toY = (v: number) => pad.top + innerH - (v / maxVal) * innerH;

  function linePath(key: 'value' | 'value2') {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d[key] ?? 0)}`).join(' ');
  }
  function areaPath(key: 'value' | 'value2') {
    const last = data.length - 1;
    return (
      linePath(key) +
      ` L${toX(last)},${pad.top + innerH} L${toX(0)},${pad.top + innerH} Z`
    );
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color1} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color1} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color2} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color2} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={pad.left} y1={toY(t)}
            x2={pad.left + innerW} y2={toY(t)}
            stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
          />
          <text x={pad.left - 6} y={toY(t) + 4} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.45">
            {t}
          </text>
        </g>
      ))}

      {/* Areas */}
      {data.some((d) => d.value2 !== undefined) && (
        <path d={areaPath('value2')} fill={`url(#g2)`} />
      )}
      <path d={areaPath('value')} fill={`url(#g1)`} />

      {/* Lines */}
      {data.some((d) => d.value2 !== undefined) && (
        <path d={linePath('value2')} fill="none" stroke={color2} strokeWidth="1.8" strokeLinejoin="round" />
      )}
      <path d={linePath('value')} fill="none" stroke={color1} strokeWidth="2" strokeLinejoin="round" />

      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.5">
          {d.label}
        </text>
      ))}
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

function SvgBarChart({ data, color = '#3b82f6', height = 160 }: BarChartProps) {
  const W = 480;
  const H = height;
  const pad = { top: 12, right: 12, bottom: 28, left: 32 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const barWidth = (innerW / data.length) * 0.55;
  const step = innerW / data.length;

  const yTicks = [0, 0.5, 1].map((t) => Math.round(t * maxVal));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {yTicks.map((t) => {
        const y = pad.top + innerH - (t / maxVal) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y}
              stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.45">
              {t}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / maxVal) * innerH;
        const x = pad.left + i * step + (step - barWidth) / 2;
        const y = pad.top + innerH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill={color} rx="3" opacity="0.85" />
            <text x={x + barWidth / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.5">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: StatusDistribution[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 52;
  const cx = 70;
  const cy = 70;
  const stroke = 22;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const slice = { ...d, dashArray: `${dash} ${gap}`, dashOffset: -offset * circumference, pct };
    offset += pct;
    return slice;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-[140px] h-[140px] flex-shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth={stroke} />
        {slices.map((s) => (
          <circle key={s.name} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={s.dashArray}
            strokeDashoffset={s.dashOffset}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize="18" fontWeight="700" fill="currentColor" fillOpacity="0.85"
          className="rotate-90 origin-center" style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <div>
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{d.value}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{d.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chart Legend ──────────────────────────────────────────────────────────────
function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 mt-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
          <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: i.color }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const {
    stats,
    activities,
    trend,
    distribution,
    hourly,
    loading: dashLoading,
  } = useDashboardData();
  const { data: queue, loading: queueLoading, error, refetch } = useVerificationQueue();
  const [search, setSearch] = useState('');

  const filteredQueue = useMemo(() => {
    if (!search) return queue;
    return queue.filter(
      (v) =>
        v.referenceId.toLowerCase().includes(search.toLowerCase()) ||
        v.applicantName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [queue, search]);

  const trendChartData = useMemo(
    () => (trend as TrendDataPoint[]).map((d) => ({ label: d.date, value: d.total, value2: d.approved })),
    [trend],
  );

  const hourlyChartData = useMemo(
    () => (hourly as HourlyDataPoint[]).map((d) => ({ label: d.hour, value: d.requests })),
    [hourly],
  );

  const processingChartData = useMemo(
    () => (trend as TrendDataPoint[]).map((d) => ({ label: d.date, value: d.rejected })),
    [trend],
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
              Verification Dashboard
            </h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
              Live workspace for compliance officers. Review incoming verification requests.
            </p>
          </div>
          <button onClick={refetch} disabled={queueLoading} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {dashLoading ? (
            <div className="col-span-2 md:col-span-5 flex justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : (
            <>
              <KpiCard label="Today's Requests" value={stats?.todayRequests ?? 0}
                icon={Inbox} iconColor="text-brand-600" iconBg="bg-brand-50 dark:bg-brand-900/20"
                trend="+12% from yesterday" trendUp />
              <KpiCard label="Pending" value={stats?.pending ?? 0}
                icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-900/20" />
              <KpiCard label="Approved" value={stats?.approved ?? 0}
                icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-900/20" />
              <KpiCard label="Rejected" value={stats?.rejected ?? 0}
                icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50 dark:bg-rose-900/20" />
              <KpiCard label="Avg Processing Time" value={stats?.avgProcessingTime ?? '—'}
                icon={Timer} iconColor="text-ink-600 dark:text-ink-400" iconBg="bg-ink-100 dark:bg-ink-800" />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Daily Trend */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-0.5">Daily Verification Trend</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Total vs approved over the past 7 days</p>
            <SvgAreaChart data={trendChartData} color1="#3b82f6" color2="#10b981" height={180} />
            <Legend items={[{ label: 'Total', color: '#3b82f6' }, { label: 'Approved', color: '#10b981' }]} />
          </div>

          {/* Status Distribution */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-0.5">Status Distribution</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Current breakdown of all requests</p>
            <div className="flex items-center justify-center h-[180px]">
              {distribution.length > 0 ? (
                <DonutChart data={distribution as StatusDistribution[]} />
              ) : (
                <Spinner size={24} />
              )}
            </div>
          </div>

          {/* Hourly Bar Chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-0.5">Hourly Verification Requests</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Today's request volume by hour</p>
            <SvgBarChart data={hourlyChartData} color="#3b82f6" height={180} />
          </div>

          {/* Avg Processing Time */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-0.5">Rejected Requests Trend</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Rejection count over the past week</p>
            <SvgAreaChart data={processingChartData} color1="#f43f5e" height={180} />
            <Legend items={[{ label: 'Rejected', color: '#f43f5e' }]} />
          </div>
        </div>

        {/* Queue + Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Queue Table */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="p-5 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                    Incoming Verification Queue
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    {queue.length} requests in queue
                  </p>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-ink-50 dark:bg-ink-800 border border-transparent rounded-lg focus:bg-white dark:focus:bg-ink-900 focus:border-brand-500 focus:outline-none transition-all dark:text-ink-200"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50">
                    <th className="table-header text-left">Reference ID</th>
                    <th className="table-header text-left">Applicant</th>
                    <th className="table-header text-left hidden md:table-cell">Aadhaar</th>
                    <th className="table-header text-left hidden md:table-cell">PAN</th>
                    <th className="table-header text-left hidden lg:table-cell">Submitted</th>
                    <th className="table-header text-left">Priority</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queueLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><SkeletonRow /></tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6 text-rose-500" />
                          <p className="text-sm text-ink-600 dark:text-ink-400">{error}</p>
                          <button onClick={refetch} className="btn-secondary text-xs mt-1">Try again</button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <p className="text-sm text-ink-500 dark:text-ink-400">No requests found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((v) => (
                      <tr key={v.id}
                        className="border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                        <td className="table-cell font-mono text-xs">{v.referenceId}</td>
                        <td className="table-cell font-medium text-ink-900 dark:text-ink-100">{v.applicantName}</td>
                        <td className="table-cell font-mono text-xs hidden md:table-cell">{v.aadhaarNumber}</td>
                        <td className="table-cell font-mono text-xs hidden md:table-cell">{v.panNumber}</td>
                        <td className="table-cell text-xs hidden lg:table-cell">{formatTime(v.submissionTime)}</td>
                        <td className="table-cell"><PriorityBadge priority={v.priority} /></td>
                        <td className="table-cell"><StatusBadge status={v.status} size="sm" /></td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => navigate(`/workspace/${v.referenceId}`)}
                            className="btn-primary text-xs py-1.5 px-3">
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-1">Recent Activities</h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">Latest actions in the workspace</p>
            <div className="space-y-3">
              {dashLoading ? (
                <div className="flex justify-center py-8"><Spinner size={20} /></div>
              ) : (
                activities.map((activity) => {
                  const config = activityIcons[activity.type];
                  const Icon = config.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 animate-fade-in">
                      <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon
                          className={`h-4 w-4 ${config.color} ${activity.type === 'processing' ? 'animate-spin' : ''}`}
                          strokeWidth={2}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink-800 dark:text-ink-200">
                          <span className="font-medium">{activity.applicantName}</span>
                          <span className="text-ink-500 dark:text-ink-400"> — {activity.type.replace('_', ' ')}</span>
                        </p>
                        <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                          {activity.referenceId} · {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
