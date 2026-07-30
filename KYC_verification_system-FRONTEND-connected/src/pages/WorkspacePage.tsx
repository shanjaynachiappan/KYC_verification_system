import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Fingerprint,
  CreditCard,
  Building2,
  ShieldCheck,
  ScanFace,
  User,
  Calendar,
  MapPin,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { FullPageSpinner } from '../components/Spinner';
import { useApplicantDetails } from '../hooks/useApplicantDetails';
import { useVerificationStatus } from '../hooks/useVerificationStatus';
import { ROUTES, WORKFLOW_STAGES } from '../constants';
import type { WorkflowStageName } from '../types';

const stageIcons: Record<WorkflowStageName, typeof Fingerprint> = {
  aadhaar_validation: Fingerprint,
  pan_validation: CreditCard,
  government_ekyc: Building2,
  aml_screening: ShieldCheck,
  face_verification: ScanFace,
};

function StageIcon({ status, name }: { status: string; name: WorkflowStageName }) {
  const Icon = stageIcons[name];
  if (status === 'completed')
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2} />;
  if (status === 'in_progress')
    return <Loader2 className="h-5 w-5 text-brand-500 animate-spin" strokeWidth={2} />;
  if (status === 'failed')
    return <XCircle className="h-5 w-5 text-rose-500" strokeWidth={2} />;
  return <Icon className="h-5 w-5 text-ink-300 dark:text-ink-600" strokeWidth={2} />;
}

function DetailRow({
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
    <div className="flex items-start gap-3 py-2.5">
      <div className="h-8 w-8 rounded-lg bg-ink-50 dark:bg-ink-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-ink-500 dark:text-ink-400" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-400 dark:text-ink-500">{label}</p>
        <p
          className={`text-sm text-ink-800 dark:text-ink-200 ${
            mono ? 'font-mono' : 'font-medium'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function WorkspacePage() {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const {
    data: applicant,
    loading: appLoading,
    error: appError,
  } = useApplicantDetails(referenceId || '');
  const {
    data: status,
    loading: statusLoading,
    error: statusError,
  } = useVerificationStatus(referenceId || '');

  if (appLoading || statusLoading) {
    return (
      <AppLayout>
        <FullPageSpinner label="Loading verification workspace..." />
      </AppLayout>
    );
  }

  if (appError || statusError || !applicant || !status) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="card p-12 flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <p className="font-medium text-ink-800 dark:text-ink-200">
              Unable to load verification workspace
            </p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {appError || statusError || 'Verification not found.'}
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
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
            Workspace
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
              Verification Workspace
            </h1>
            <p className="font-mono text-sm text-ink-500 dark:text-ink-400 mt-1">
              {referenceId}
            </p>
          </div>
          <button
            onClick={() => navigate(`/face/${referenceId}`)}
            className="btn-primary"
          >
            <ScanFace className="h-4 w-4" />
            Proceed to Face Verification
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — Applicant Info */}
          <div className="lg:col-span-1 space-y-5">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
                Applicant Information
              </h3>
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                <DetailRow
                  icon={User}
                  label="Applicant Name"
                  value={applicant.applicantName}
                />
                <DetailRow
                  icon={Fingerprint}
                  label="Aadhaar Number"
                  value={applicant.aadhaarNumber}
                  mono
                />
                <DetailRow
                  icon={CreditCard}
                  label="PAN Number"
                  value={applicant.panNumber}
                  mono
                />
                <DetailRow
                  icon={Calendar}
                  label="Submission Time"
                  value={new Date(applicant.submissionTime).toLocaleString(
                    'en-US',
                    { dateStyle: 'medium', timeStyle: 'short' },
                  )}
                />
              </div>
            </div>

            {/* Government Verification */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <Building2
                    className="h-4 w-4 text-brand-600 dark:text-brand-400"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Government Verification
                </h3>
              </div>
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                <DetailRow
                  icon={User}
                  label="Name (as per Aadhaar)"
                  value={applicant.government.name}
                />
                <DetailRow
                  icon={Calendar}
                  label="Date of Birth"
                  value={applicant.government.dob}
                />
                <DetailRow
                  icon={User}
                  label="Gender"
                  value={applicant.government.gender}
                />
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={applicant.government.address}
                />
              </div>
              <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-500 dark:text-ink-400">
                    Aadhaar Verified
                  </span>
                  {applicant.government.aadhaarVerified ? (
                    <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="badge bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px]">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-500 dark:text-ink-400">
                    PAN Verified
                  </span>
                  {applicant.government.panVerified ? (
                    <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="badge bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px]">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Timeline + Progress */}
          <div className="lg:col-span-2 space-y-5">
            {/* Verification Timeline */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-1">
                Verification Timeline
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-6">
                Sequential verification stages from identity to face match
              </p>
              <div className="space-y-1">
                {status.stages.map((stage, i) => {
                  const config = WORKFLOW_STAGES.find(
                    (s) => s.name === stage.name,
                  )!;
                  const isLast = i === status.stages.length - 1;
                  return (
                    <div key={stage.name} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            stage.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : stage.status === 'in_progress'
                              ? 'bg-brand-50 dark:bg-brand-900/20 ring-4 ring-brand-500/10'
                              : 'bg-ink-50 dark:bg-ink-800'
                          }`}
                        >
                          <StageIcon status={stage.status} name={stage.name} />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 transition-colors duration-500 ${
                              stage.status === 'completed'
                                ? 'bg-emerald-300 dark:bg-emerald-700'
                                : 'bg-ink-200 dark:bg-ink-700'
                            }`}
                          />
                        )}
                      </div>
                      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                              {config.label}
                            </h4>
                            {stage.status === 'in_progress' && (
                              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 border border-brand-200 dark:border-brand-800 text-[11px]">
                                <span className="h-1 w-1 rounded-full bg-brand-500 animate-pulse" />
                                Running
                              </span>
                            )}
                            {stage.status === 'completed' && (
                              <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                                Completed
                              </span>
                            )}
                            {stage.status === 'pending' && (
                              <span className="badge bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-500 border border-ink-200 dark:border-ink-700 text-[11px]">
                                Queued
                              </span>
                            )}
                          </div>
                          {stage.timestamp && (
                            <span className="text-xs text-ink-400 dark:text-ink-500">
                              {new Date(stage.timestamp).toLocaleTimeString(
                                'en-US',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Processing Progress */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-1">
                Processing Progress
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
                Current stage: {status.currentStage.replace(/_/g, ' ')}
              </p>

              {/* Progress bar */}
              <div className="relative h-3 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-brand-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-ink-500 dark:text-ink-400">
                  {status.progress}% complete
                </span>
                <span className="text-xs text-ink-400 dark:text-ink-500">
                  {status.stages.filter((s) => s.status === 'completed').length}/
                  {status.stages.length} stages
                </span>
              </div>

              {/* Status messages */}
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-ink-700 dark:text-ink-300 uppercase tracking-wider">
                  Status Messages
                </p>
                {status.statusMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-sm animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {i < status.statusMessages.length - 1 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-brand-500 animate-spin flex-shrink-0" />
                    )}
                    <span
                      className={
                        i < status.statusMessages.length - 1
                          ? 'text-ink-500 dark:text-ink-400'
                          : 'text-ink-800 dark:text-ink-200 font-medium'
                      }
                    >
                      {msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow guide */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50 mb-3">
                Verification Workflow
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {[
                  'Incoming Request',
                  'Identity Verification',
                  'Government Verification',
                  'AML',
                  'Face Verification',
                  'Approve / Reject',
                ].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg ${
                        i <= 3
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                          : 'bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500'
                      }`}
                    >
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-ink-300 dark:text-ink-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
