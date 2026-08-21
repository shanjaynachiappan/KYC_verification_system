import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  X,
  Download,
  CheckCircle2,
  XCircle,
  Fingerprint,
  CreditCard,
  Building2,
  ShieldCheck,
  ScanFace,
  User,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { FullPageSpinner } from '../components/Spinner';
import { useVerificationResult } from '../hooks/useVerificationResult';
import { useVerificationAction } from '../hooks/useVerificationAction';
import { ROUTES } from '../constants';

function SummaryRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof User;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ink-100 dark:border-ink-800 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-ink-50 dark:bg-ink-800 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" strokeWidth={2} />
        </div>
        <span className="text-sm text-ink-600 dark:text-ink-400">{label}</span>
      </div>
      <span
        className={`text-sm font-medium text-ink-800 dark:text-ink-200 ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function VerifyItem({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ink-100 dark:border-ink-800 last:border-0">
      <span className="text-sm text-ink-600 dark:text-ink-400">{label}</span>
      {verified ? (
        <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </span>
      ) : (
        <span className="badge bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px]">
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      )}
    </div>
  );
}

export function ResultPage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useVerificationResult(
    referenceId || '',
  );
  const { approve, reject, loading: actionLoading } = useVerificationAction();
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(
    null,
  );

  const handleApprove = async () => {
    await approve(referenceId!);
    setConfirmAction(null);
    refetch();
  };

  const handleReject = async () => {
    await reject(referenceId!);
    setConfirmAction(null);
    refetch();
  };

  const handleDownload = () => {
    const report = {
      referenceId,
      ...data,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${referenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <FullPageSpinner label="Loading verification result..." />
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
              Unable to load verification result
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {error || 'Result not found.'}
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

  const amlConfig = {
    clear: {
      label: 'Clear',
      class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    },
    flagged: {
      label: 'Flagged',
      class: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
    },
    review: {
      label: 'Under Review',
      class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    },
  };
  const aml = amlConfig[data.amlResult.status];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 mb-6">
          <Link
            to={ROUTES.DASHBOARD}
            className="hover:text-ink-800 dark:hover:text-ink-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="text-ink-300 dark:text-ink-600">/</span>
          <span className="text-ink-700 dark:text-ink-300 font-medium">
            Final Result
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
                Verification Summary
              </h1>
              <StatusBadge status={data.decision} />
            </div>
            <p className="font-mono text-sm text-ink-500 dark:text-ink-400 mt-1.5">
              {data.referenceId}
            </p>
          </div>
          <button onClick={handleDownload} className="btn-secondary">
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>

        {/* Verification Summary Card */}
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
            Applicant Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <SummaryRow
              icon={User}
              label="Applicant Name"
              value={data.applicantName}
            />
            <SummaryRow
              icon={FileText}
              label="Reference ID"
              value={data.referenceId}
              mono
            />
            <SummaryRow
              icon={Fingerprint}
              label="Aadhaar"
              value={data.aadhaarNumber}
              mono
            />
            <SummaryRow
              icon={CreditCard}
              label="PAN"
              value={data.panNumber}
              mono
            />
          </div>
        </div>

        {/* Verification Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Government Verification */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Government Verification
              </h3>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800 px-4 py-1">
              <VerifyItem
                label="Aadhaar Verified"
                verified={data.governmentVerification.aadhaarVerified}
              />
              <VerifyItem
                label="PAN Verified"
                verified={data.governmentVerification.panVerified}
              />
              <VerifyItem
                label="Aadhaar Linked to PAN"
                verified={data.governmentVerification.aadhaarLinkedToPan}
              />
            </div>
          </div>

          {/* AML Result */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  AML Result
                </h3>
              </div>
              <span className={`badge ${aml.class}`}>{aml.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3.5">
                <p className="text-xs text-ink-400 dark:text-ink-500">Risk Score</p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    data.amlResult.riskScore < 30
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : data.amlResult.riskScore < 70
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {data.amlResult.riskScore}/100
                </p>
              </div>
              <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3.5">
                <p className="text-xs text-ink-400 dark:text-ink-500">
                  Watchlist Matches
                </p>
                <p className="text-xl font-bold text-ink-800 dark:text-ink-200 mt-1">
                  {data.amlResult.matches}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Face Match Result */}
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <ScanFace className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Face Match Result
              </h3>
            </div>
            <span
              className={`badge ${
                data.faceMatchResult.status === 'matched'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {data.faceMatchResult.status === 'matched' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {data.faceMatchResult.status === 'matched' ? 'Matched' : 'Not Matched'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3.5">
              <p className="text-xs text-ink-400 dark:text-ink-500">Match Score</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  data.faceMatchResult.score >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {data.faceMatchResult.score.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3.5">
              <p className="text-xs text-ink-400 dark:text-ink-500">
                Liveness Check
              </p>
              <p
                className={`text-sm font-bold mt-1.5 ${
                  data.faceMatchResult.liveness === 'live'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {data.faceMatchResult.liveness === 'live' ? 'Live' : 'Failed'}
              </p>
            </div>
          </div>
        </div>

        {/* Decision */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-1">
            Final Decision
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
            Approve or reject this verification. This action will be recorded in
            the audit trail.
          </p>
          {confirmAction ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 p-4">
              <p className="text-sm text-ink-700 dark:text-ink-300 flex-1">
                {confirmAction === 'approve'
                  ? 'Are you sure you want to approve this verification?'
                  : 'Are you sure you want to reject this verification?'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="btn-ghost text-sm"
                >
                  Cancel
                </button>
                {confirmAction === 'approve' ? (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="btn-success text-sm"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirm Approve
                  </button>
                ) : (
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="btn-danger text-sm"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Confirm Reject
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmAction('approve')}
                className="btn-success flex-1"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => setConfirmAction('reject')}
                className="btn-danger flex-1"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="btn-secondary"
              >
                Back to Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
