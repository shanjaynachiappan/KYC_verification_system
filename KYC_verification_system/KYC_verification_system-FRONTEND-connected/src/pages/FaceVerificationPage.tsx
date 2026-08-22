import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ScanFace,
  Smartphone,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { FullPageSpinner } from '../components/Spinner';
import { useFaceVerification } from '../hooks/useFaceVerification';
import { ROUTES } from '../constants';

export function FaceVerificationPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useFaceVerification(referenceId || '');

  if (loading) {
    return (
      <AppLayout>
        <FullPageSpinner label="Loading face verification data..." />
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="card p-12 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <p className="font-medium text-ink-800 dark:text-ink-200">
              Unable to load face verification data
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {error || 'Face verification data not found.'}
            </p>
            <Link to={ROUTES.DASHBOARD} className="btn-secondary mt-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const matched = data.faceVerificationStatus === 'matched';
  const live = data.livenessStatus === 'live';
  const highScore = data.similarityPercentage >= 80;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 mb-6">
          <Link
            to={`/workspace/${referenceId}`}
            className="hover:text-ink-800 dark:hover:text-ink-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspace
          </Link>
          <span className="text-ink-300 dark:text-ink-600">/</span>
          <span className="text-ink-700 dark:text-ink-300 font-medium">
            Face Verification
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
              Face Verification
            </h1>
            <p className="font-mono text-sm text-ink-500 dark:text-ink-400 mt-1">
              {referenceId}
            </p>
          </div>
          <button
            onClick={() => navigate(`/result/${referenceId}`)}
            className="btn-primary"
          >
            View Final Result
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Left — Uploaded Selfie */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Uploaded Selfie
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Captured from mobile app
                </p>
              </div>
            </div>
            <div className="aspect-[4/5] rounded-xl bg-ink-100 dark:bg-ink-800 flex flex-col items-center justify-center gap-3 border border-ink-200 dark:border-ink-700">
              {data.selfieUrl ? (
                <img
                  src={data.selfieUrl}
                  alt="Selfie"
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <>
                  <div className="h-20 w-20 rounded-full bg-white dark:bg-ink-700 flex items-center justify-center shadow-sm">
                    <ScanFace className="h-10 w-10 text-ink-400 dark:text-ink-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 font-medium">
                    Selfie from Mobile App
                  </p>
                  <p className="text-xs text-ink-400 dark:text-ink-500">
                    Placeholder for uploaded image
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right — Government Photo */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center">
                <BadgeCheck className="h-4 w-4 text-ink-600 dark:text-ink-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Government Photo
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  From Aadhaar database
                </p>
              </div>
            </div>
            <div className="aspect-[4/5] rounded-xl bg-ink-100 dark:bg-ink-800 flex flex-col items-center justify-center gap-3 border border-ink-200 dark:border-ink-700">
              {data.governmentPhotoUrl ? (
                <img
                  src={data.governmentPhotoUrl}
                  alt="Government Photo"
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                <>
                  <div className="h-20 w-20 rounded-full bg-white dark:bg-ink-700 flex items-center justify-center shadow-sm">
                    <UserIcon />
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 font-medium">
                    Government Photo
                  </p>
                  <p className="text-xs text-ink-400 dark:text-ink-500">
                    From UIDAI records
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Face Match Score */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-ink-500 dark:text-ink-400" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Face Match Score
              </h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-bold ${
                  highScore
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {data.matchScore.toFixed(1)}
              </span>
              <span className="text-lg text-ink-400">%</span>
            </div>
            <div className="mt-3 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  highScore ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${data.matchScore}%` }}
              />
            </div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-2">
              Similarity percentage between the two images
            </p>
          </div>

          {/* Face Verification Status */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-ink-500 dark:text-ink-400" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Face Verification Status
              </h3>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {matched ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      Matched
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Identity confirmed
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-rose-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                      Not Matched
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Identity mismatch detected
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Liveness Status */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ScanFace className="h-4 w-4 text-ink-500 dark:text-ink-400" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Liveness Status
              </h3>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {live ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      Live
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Real person detected
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-rose-500" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                      Failed
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Liveness check failed
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-10 w-10 text-ink-400 dark:text-ink-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
