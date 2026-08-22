import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  FileScan,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '../layout/AppLayout';
import { documentVerificationService } from '../services/documentVerificationService';
import type {
  PassportExtractionResult,
  PayslipExtractionResult,
  DeepfakeCheckResult,
  AiGeneratedCheckResult,
} from '../types';

type CheckKind = 'passport' | 'payslip' | 'deepfake' | 'ai-generated';

interface CheckState {
  file: File | null;
  loading: boolean;
  error: string | null;
  result: unknown | null;
}

const initialCheckState: CheckState = { file: null, loading: false, error: null, result: null };

const CHECK_CONFIG: Record<CheckKind, { title: string; description: string }> = {
  passport: {
    title: 'Passport OCR',
    description: 'Extracts passport number, name, DOB, expiry and other fields from an uploaded passport image.',
  },
  payslip: {
    title: 'Payslip OCR',
    description: 'Extracts employee name, company, designation and pay-period fields from an uploaded payslip image.',
  },
  deepfake: {
    title: 'Deepfake Detection',
    description: 'Runs a selfie through the Xception-based deepfake classifier. Requires the model weights file to be present on the server.',
  },
  'ai-generated': {
    title: 'AI-Generated Image Detection',
    description: 'Checks whether a selfie was AI-generated rather than a real photo. Model downloads from Hugging Face on first server run.',
  },
};

function friendlyError(err: unknown): string {
  const anyErr = err as { response?: { status?: number; data?: { detail?: string } } };
  const status = anyErr?.response?.status;
  const detail = anyErr?.response?.data?.detail;
  if (status === 503) {
    return detail || 'This detection model is unavailable on the server right now.';
  }
  if (status === 400) {
    return detail || 'The uploaded image was rejected (no face found, wrong file type, or unreadable).';
  }
  return detail || 'Request failed. Check that the backend is running and reachable.';
}

function UploadCard({
  kind,
  state,
  onFileChange,
  onRun,
}: {
  kind: CheckKind;
  state: CheckState;
  onFileChange: (kind: CheckKind, e: ChangeEvent<HTMLInputElement>) => void;
  onRun: (kind: CheckKind) => void;
}) {
  const config = CHECK_CONFIG[kind];

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
          <FileScan className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h3 className="font-medium text-ink-800 dark:text-ink-200">{config.title}</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{config.description}</p>
        </div>
      </div>

      <label className="border border-dashed border-ink-200 dark:border-ink-700 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-brand-400 transition-colors">
        <UploadCloud className="h-5 w-5 text-ink-400 shrink-0" />
        <span className="text-sm text-ink-500 dark:text-ink-400 truncate">
          {state.file ? state.file.name : 'Choose a JPEG or PNG image...'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => onFileChange(kind, e)}
        />
      </label>

      <button
        className="btn-secondary self-start"
        disabled={!state.file || state.loading}
        onClick={() => onRun(kind)}
      >
        {state.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Running...
          </>
        ) : (
          'Run check'
        )}
      </button>

      {state.error && (
        <div className="flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {!!state.result && (
        <div className="text-sm bg-ink-50 dark:bg-ink-800/50 rounded-lg p-3 overflow-x-auto">
          <ResultSummary kind={kind} result={state.result} />
          <pre className="mt-2 text-xs text-ink-500 dark:text-ink-400 whitespace-pre-wrap">
            {JSON.stringify(state.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ResultSummary({ kind, result }: { kind: CheckKind; result: unknown }) {
  if (kind === 'deepfake' || kind === 'ai-generated') {
    const r = result as DeepfakeCheckResult | AiGeneratedCheckResult;
    const isReal = r.prediction === 'Real';
    return (
      <div className="flex items-center gap-2 font-medium">
        {isReal ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <XCircle className="h-4 w-4 text-rose-500" />
        )}
        <span className={isReal ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
          {r.prediction} ({(r.confidence * 100).toFixed(1)}% confidence)
        </span>
      </div>
    );
  }

  const r = result as PassportExtractionResult | PayslipExtractionResult;
  if (!r.success) {
    return (
      <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <span>Stopped at: {r.stage} -- {r.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4" />
      <span>Extraction succeeded -- see fields below</span>
    </div>
  );
}

export function DocumentChecksPage() {
  const [states, setStates] = useState<Record<CheckKind, CheckState>>({
    passport: { ...initialCheckState },
    payslip: { ...initialCheckState },
    deepfake: { ...initialCheckState },
    'ai-generated': { ...initialCheckState },
  });

  function handleFileChange(kind: CheckKind, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setStates((prev) => ({
      ...prev,
      [kind]: { ...initialCheckState, file },
    }));
  }

  async function handleRun(kind: CheckKind) {
    const file = states[kind].file;
    if (!file) return;

    setStates((prev) => ({ ...prev, [kind]: { ...prev[kind], loading: true, error: null, result: null } }));

    try {
      let result: unknown;
      switch (kind) {
        case 'passport':
          result = (await documentVerificationService.extractPassport(file)).data;
          break;
        case 'payslip':
          result = (await documentVerificationService.extractPayslip(file)).data;
          break;
        case 'deepfake':
          result = (await documentVerificationService.checkDeepfake(file)).data;
          break;
        case 'ai-generated':
          result = (await documentVerificationService.checkAiGenerated(file)).data;
          break;
      }
      setStates((prev) => ({ ...prev, [kind]: { ...prev[kind], loading: false, result } }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [kind]: { ...prev[kind], loading: false, error: friendlyError(err) },
      }));
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-100">Document &amp; AI Checks</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Standalone test panel for the passport OCR, payslip OCR, deepfake detection, and
            AI-generated-image detection endpoints. Not yet wired into the applicant onboarding
            flow -- this page exists to test each endpoint independently against the live backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadCard kind="passport" state={states.passport} onFileChange={handleFileChange} onRun={handleRun} />
          <UploadCard kind="payslip" state={states.payslip} onFileChange={handleFileChange} onRun={handleRun} />
          <UploadCard kind="deepfake" state={states.deepfake} onFileChange={handleFileChange} onRun={handleRun} />
          <UploadCard kind="ai-generated" state={states['ai-generated']} onFileChange={handleFileChange} onRun={handleRun} />
        </div>
      </div>
    </AppLayout>
  );
}
