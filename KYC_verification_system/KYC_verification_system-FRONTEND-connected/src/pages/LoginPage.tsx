import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, ROUTES } from '../constants';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await signIn(data.username, data.password, true);
      navigate(ROUTES.DASHBOARD);
    } catch {
      setServerError('Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-ink-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-ink-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(37,99,235,0.3) 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <ShieldIcon />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              The verification workspace built for compliance officers.
            </h2>
            <p className="mt-4 text-ink-400 leading-relaxed">
              Review incoming eKYC and AML requests in real time. Identity,
              government, and face verification — unified in one portal.
            </p>
            <div className="mt-10 space-y-4">
              {[
                'Live verification queue with priority routing',
                'Government eKYC and AML screening built in',
                'AI-powered face match with liveness detection',
                'Complete audit trail for every decision',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-ink-300"
                >
                  <div className="h-5 w-5 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                    <CheckIcon />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-500">
            © 2026 {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            to={ROUTES.LANDING}
            className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="mb-8">
              <Logo size="md" />
            </div>

            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
              Sign in to your workspace
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Enter your credentials to access the verification portal.
            </p>

            {serverError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-400 animate-fade-in-fast">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  className={`input ${
                    errors.username
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                      : ''
                  }`}
                  {...register('username')}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input pr-10 ${
                      errors.password
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                        : ''
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink-300 dark:border-ink-600 text-brand-600 focus:ring-brand-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-400 dark:text-ink-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-5 w-5 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3 text-brand-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
