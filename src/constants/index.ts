import type { VerificationStatus, Priority } from '../types';

export const APP_NAME = 'VerifyLine';
export const APP_TAGLINE = 'AI-Powered eKYC & AML Verification';
export const APP_DESCRIPTION =
  'A live verification workspace where compliance officers review incoming eKYC and AML requests in real time. Identity, government, and face verification — unified in one portal.';

export const API_BASE_URL = '/api/v1';
export const API_LATENCY_MS = 600;

export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  WORKSPACE: '/workspace/:referenceId',
  FACE: '/face/:referenceId',
  RESULT: '/result/:referenceId',
} as const;

export const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: 'Pending',
    badgeClass:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  in_review: {
    label: 'In Review',
    badgeClass:
      'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
  processing: {
    label: 'Processing',
    badgeClass:
      'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-800',
    dotClass: 'bg-brand-500',
  },
  approved: {
    label: 'Approved',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    badgeClass:
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeClass: string }
> = {
  low: {
    label: 'Low',
    badgeClass:
      'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400',
  },
  medium: {
    label: 'Medium',
    badgeClass:
      'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  },
  high: {
    label: 'High',
    badgeClass:
      'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  urgent: {
    label: 'Urgent',
    badgeClass:
      'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

export const WORKFLOW_STAGES = [
  { name: 'aadhaar_validation', label: 'Aadhaar Validation', description: 'Validating Aadhaar number format and existence' },
  { name: 'pan_validation', label: 'PAN Validation', description: 'Validating PAN number against income tax database' },
  { name: 'government_ekyc', label: 'Government eKYC', description: 'Fetching demographic data from UIDAI' },
  { name: 'aml_screening', label: 'AML Screening', description: 'Screening against global watchlists' },
  { name: 'face_verification', label: 'Face Verification', description: 'Matching selfie with Aadhaar photo' },
] as const;

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
  { label: 'Verification Queue', icon: 'ListChecks', route: '/dashboard' },
  { label: 'Verification Workspace', icon: 'FolderSearch', route: '/dashboard' },
  { label: 'Face Verification', icon: 'ScanFace', route: '/dashboard' },
  { label: 'Results', icon: 'FileCheck', route: '/dashboard' },
] as const;
