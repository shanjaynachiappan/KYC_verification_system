import { Link } from 'react-router-dom';
import {
  Fingerprint,
  Building2,
  ShieldCheck,
  ScanFace,
  ArrowRight,
  Lock,
  CheckCircle2,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, ROUTES } from '../constants';

const features = [
  {
    icon: Fingerprint,
    title: 'Identity Verification',
    description: 'Validate Aadhaar and PAN against authoritative government databases in real time.',
  },
  {
    icon: Building2,
    title: 'Government eKYC',
    description: 'Fetch demographic data directly from UIDAI and income tax records.',
  },
  {
    icon: ShieldCheck,
    title: 'AML Screening',
    description: 'Screen applicants against global anti-money laundering watchlists.',
  },
  {
    icon: ScanFace,
    title: 'Face Verification',
    description: 'Match live selfies with government photos using AI liveness detection.',
  },
];

const platformStats = [
  { label: "Today's Requests", value: '47', icon: Activity, color: 'text-brand-600' },
  { label: 'Verification Success Rate', value: '80%', icon: TrendingUp, color: 'text-emerald-600' },
  { label: 'Average Processing Time', value: '3m 24s', icon: Clock, color: 'text-ink-600' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      {/* Nav */}
      <nav className="border-b border-ink-200/70 dark:border-ink-800 bg-white/80 dark:bg-ink-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to={ROUTES.LOGIN}
              className="text-sm font-medium text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200 transition-colors hidden sm:inline"
            >
              Sign in
            </Link>
            <Link to={ROUTES.LOGIN} className="btn-primary">
              Admin Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-50/40 dark:bg-ink-900/40" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3.5 py-1.5 text-xs font-medium text-ink-600 dark:text-ink-400 shadow-soft mb-8 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live verification workspace
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 dark:text-ink-50 leading-[1.1] animate-fade-in">
            AI-Powered eKYC & AML
            <br />
            Verification Portal
          </h1>
          <p className="mt-6 text-lg text-ink-500 dark:text-ink-400 leading-relaxed max-w-2xl mx-auto animate-fade-in">
            {APP_DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Link to={ROUTES.LOGIN} className="btn-primary text-base px-6 py-3">
              <Lock className="h-4 w-4" />
              Admin Login
            </Link>
            <Link to={ROUTES.DASHBOARD} className="btn-secondary text-base px-6 py-3">
              View Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Platform Statistics */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {platformStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="card p-6 text-center animate-fade-in"
              >
                <div className="h-10 w-10 rounded-xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center mx-auto mb-3">
                  <Icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
                </div>
                <p className="text-3xl font-bold text-ink-900 dark:text-ink-50">
                  {stat.value}
                </p>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ink-900 dark:text-ink-50">
            Complete verification workflow
          </h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">
            From incoming request to final decision — every step in one portal.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card p-6 hover:shadow-elevated transition-shadow duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-ink-200/70 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/50">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              'DPDPA compliant',
              'UIDAI authorized',
              'End-to-end encryption',
              'Audit trail',
              'Role-based access',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-400"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-200/70 dark:border-ink-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-sm text-ink-400 dark:text-ink-500">
              {APP_TAGLINE}
            </span>
          </div>
          <p className="text-sm text-ink-400 dark:text-ink-500">
            © 2026 {APP_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
