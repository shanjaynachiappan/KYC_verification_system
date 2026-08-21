import type {
  VerificationRequest,
  ApplicantDetails,
  GovernmentDetails,
  VerificationStatusData,
  FaceVerificationData,
  VerificationResult,
  ActivityItem,
  DashboardStats,
  TrendDataPoint,
  StatusDistribution,
  HourlyDataPoint,
} from '../types';

export const mockQueue: VerificationRequest[] = [
  {
    id: '1',
    referenceId: 'VRF-2026-001234',
    applicantName: 'Arjun Mehta',
    aadhaarNumber: 'XXXX-XXXX-7821',
    panNumber: 'ABCPM1234D',
    submissionTime: '2026-07-14T09:24:00Z',
    priority: 'high',
    status: 'in_review',
  },
  {
    id: '2',
    referenceId: 'VRF-2026-001235',
    applicantName: 'Priya Nair',
    aadhaarNumber: 'XXXX-XXXX-4590',
    panNumber: 'AKLPN5678E',
    submissionTime: '2026-07-14T10:10:00Z',
    priority: 'urgent',
    status: 'pending',
  },
  {
    id: '3',
    referenceId: 'VRF-2026-001236',
    applicantName: 'Rohan Desai',
    aadhaarNumber: 'XXXX-XXXX-1207',
    panNumber: 'BCHRD9012F',
    submissionTime: '2026-07-14T11:02:00Z',
    priority: 'medium',
    status: 'processing',
  },
  {
    id: '4',
    referenceId: 'VRF-2026-001237',
    applicantName: 'Sneha Kulkarni',
    aadhaarNumber: 'XXXX-XXXX-8834',
    panNumber: 'DLPSK3456G',
    submissionTime: '2026-07-13T14:30:00Z',
    priority: 'low',
    status: 'approved',
  },
  {
    id: '5',
    referenceId: 'VRF-2026-001238',
    applicantName: 'Vikram Iyer',
    aadhaarNumber: 'XXXX-XXXX-6543',
    panNumber: 'EJPMI7890H',
    submissionTime: '2026-07-13T16:45:00Z',
    priority: 'high',
    status: 'rejected',
  },
  {
    id: '6',
    referenceId: 'VRF-2026-001239',
    applicantName: 'Ananya Reddy',
    aadhaarNumber: 'XXXX-XXXX-9921',
    panNumber: 'FKLAR2345J',
    submissionTime: '2026-07-14T08:15:00Z',
    priority: 'medium',
    status: 'in_review',
  },
  {
    id: '7',
    referenceId: 'VRF-2026-001240',
    applicantName: 'Karan Malhotra',
    aadhaarNumber: 'XXXX-XXXX-3378',
    panNumber: 'GLMKM6789K',
    submissionTime: '2026-07-14T12:00:00Z',
    priority: 'low',
    status: 'pending',
  },
];

const govDetailsMap: Record<string, GovernmentDetails> = {
  'VRF-2026-001234': {
    name: 'Arjun Mehta',
    dob: '1992-04-18',
    gender: 'Male',
    address: '42, Residency Road, Indiranagar, Bengaluru, Karnataka 560038',
    aadhaarVerified: true,
    panVerified: true,
  },
  'VRF-2026-001235': {
    name: 'Priya Nair',
    dob: '1995-08-22',
    gender: 'Female',
    address: '18, Marine Drive, Kochi, Kerala 682001',
    aadhaarVerified: true,
    panVerified: false,
  },
  'VRF-2026-001236': {
    name: 'Rohan Desai',
    dob: '1990-12-05',
    gender: 'Male',
    address: '7, Model Town, Ahmedabad, Gujarat 380015',
    aadhaarVerified: true,
    panVerified: true,
  },
};

export const mockApplicantDetails: Record<string, ApplicantDetails> = {
  'VRF-2026-001234': {
    referenceId: 'VRF-2026-001234',
    applicantName: 'Arjun Mehta',
    aadhaarNumber: '4521 7890 7821',
    panNumber: 'ABCPM1234D',
    submissionTime: '2026-07-14T09:24:00Z',
    government: govDetailsMap['VRF-2026-001234'],
  },
  'VRF-2026-001235': {
    referenceId: 'VRF-2026-001235',
    applicantName: 'Priya Nair',
    aadhaarNumber: '7821 4567 4590',
    panNumber: 'AKLPN5678E',
    submissionTime: '2026-07-14T10:10:00Z',
    government: govDetailsMap['VRF-2026-001235'],
  },
  'VRF-2026-001236': {
    referenceId: 'VRF-2026-001236',
    applicantName: 'Rohan Desai',
    aadhaarNumber: '3344 5566 1207',
    panNumber: 'BCHRD9012F',
    submissionTime: '2026-07-14T11:02:00Z',
    government: govDetailsMap['VRF-2026-001236'],
  },
};

export const mockVerificationStatus: Record<string, VerificationStatusData> = {
  'VRF-2026-001234': {
    referenceId: 'VRF-2026-001234',
    progress: 80,
    currentStage: 'face_verification',
    stages: [
      { name: 'aadhaar_validation', label: 'Aadhaar Validation', status: 'completed', timestamp: '2026-07-14T09:28:00Z' },
      { name: 'pan_validation', label: 'PAN Validation', status: 'completed', timestamp: '2026-07-14T09:32:00Z' },
      { name: 'government_ekyc', label: 'Government eKYC', status: 'completed', timestamp: '2026-07-14T09:38:00Z' },
      { name: 'aml_screening', label: 'AML Screening', status: 'completed', timestamp: '2026-07-14T09:42:00Z' },
      { name: 'face_verification', label: 'Face Verification', status: 'in_progress', timestamp: null },
    ],
    statusMessages: [
      'Fetching Government Records',
      'Validating Identity',
      'Checking AML Database',
      'Waiting for Selfie',
    ],
  },
  'VRF-2026-001235': {
    referenceId: 'VRF-2026-001235',
    progress: 40,
    currentStage: 'government_ekyc',
    stages: [
      { name: 'aadhaar_validation', label: 'Aadhaar Validation', status: 'completed', timestamp: '2026-07-14T10:14:00Z' },
      { name: 'pan_validation', label: 'PAN Validation', status: 'completed', timestamp: '2026-07-14T10:18:00Z' },
      { name: 'government_ekyc', label: 'Government eKYC', status: 'in_progress', timestamp: null },
      { name: 'aml_screening', label: 'AML Screening', status: 'pending', timestamp: null },
      { name: 'face_verification', label: 'Face Verification', status: 'pending', timestamp: null },
    ],
    statusMessages: [
      'Fetching Government Records',
      'Validating Identity',
    ],
  },
  'VRF-2026-001236': {
    referenceId: 'VRF-2026-001236',
    progress: 60,
    currentStage: 'aml_screening',
    stages: [
      { name: 'aadhaar_validation', label: 'Aadhaar Validation', status: 'completed', timestamp: '2026-07-14T11:05:00Z' },
      { name: 'pan_validation', label: 'PAN Validation', status: 'completed', timestamp: '2026-07-14T11:08:00Z' },
      { name: 'government_ekyc', label: 'Government eKYC', status: 'completed', timestamp: '2026-07-14T11:12:00Z' },
      { name: 'aml_screening', label: 'AML Screening', status: 'in_progress', timestamp: null },
      { name: 'face_verification', label: 'Face Verification', status: 'pending', timestamp: null },
    ],
    statusMessages: [
      'Fetching Government Records',
      'Validating Identity',
      'Checking AML Database',
    ],
  },
};

export const mockFaceData: Record<string, FaceVerificationData> = {
  'VRF-2026-001234': {
    referenceId: 'VRF-2026-001234',
    selfieUrl: null,
    governmentPhotoUrl: null,
    matchScore: 96.4,
    similarityPercentage: 96.4,
    faceVerificationStatus: 'matched',
    livenessStatus: 'live',
  },
  'VRF-2026-001235': {
    referenceId: 'VRF-2026-001235',
    selfieUrl: null,
    governmentPhotoUrl: null,
    matchScore: 72.1,
    similarityPercentage: 72.1,
    faceVerificationStatus: 'not_matched',
    livenessStatus: 'live',
  },
};

export const mockVerificationResult: Record<string, VerificationResult> = {
  'VRF-2026-001234': {
    referenceId: 'VRF-2026-001234',
    applicantName: 'Arjun Mehta',
    aadhaarNumber: '4521 7890 7821',
    panNumber: 'ABCPM1234D',
    governmentVerification: {
      aadhaarVerified: true,
      panVerified: true,
      aadhaarLinkedToPan: true,
    },
    amlResult: {
      status: 'clear',
      riskScore: 12,
      matches: 0,
    },
    faceMatchResult: {
      score: 96.4,
      status: 'matched',
      liveness: 'live',
    },
    decision: 'in_review',
  },
};

export const mockActivities: ActivityItem[] = [
  { id: '1', type: 'approved', referenceId: 'VRF-2026-001237', applicantName: 'Sneha Kulkarni', adminName: 'Admin', timestamp: '2026-07-14T12:30:00Z' },
  { id: '2', type: 'submitted', referenceId: 'VRF-2026-001240', applicantName: 'Karan Malhotra', adminName: 'System', timestamp: '2026-07-14T12:00:00Z' },
  { id: '3', type: 'processing', referenceId: 'VRF-2026-001236', applicantName: 'Rohan Desai', adminName: 'System', timestamp: '2026-07-14T11:05:00Z' },
  { id: '4', type: 'rejected', referenceId: 'VRF-2026-001238', applicantName: 'Vikram Iyer', adminName: 'Admin', timestamp: '2026-07-13T17:20:00Z' },
  { id: '5', type: 'submitted', referenceId: 'VRF-2026-001239', applicantName: 'Ananya Reddy', adminName: 'System', timestamp: '2026-07-14T08:15:00Z' },
];

export const mockDashboardStats: DashboardStats = {
  todayRequests: 47,
  pending: 12,
  approved: 28,
  rejected: 7,
  avgProcessingTime: '3m 24s',
  successRate: 80,
};

export const mockTrendData: TrendDataPoint[] = [
  { date: 'Jul 8', total: 32, approved: 24, rejected: 5 },
  { date: 'Jul 9', total: 45, approved: 35, rejected: 7 },
  { date: 'Jul 10', total: 38, approved: 30, rejected: 4 },
  { date: 'Jul 11', total: 52, approved: 40, rejected: 8 },
  { date: 'Jul 12', total: 41, approved: 33, rejected: 5 },
  { date: 'Jul 13', total: 55, approved: 42, rejected: 9 },
  { date: 'Jul 14', total: 47, approved: 28, rejected: 7 },
];

export const mockStatusDistribution: StatusDistribution[] = [
  { name: 'Approved', value: 28, color: '#10b981' },
  { name: 'Pending', value: 12, color: '#f59e0b' },
  { name: 'Rejected', value: 7, color: '#f43f5e' },
];

export const mockHourlyData: HourlyDataPoint[] = [
  { hour: '09:00', requests: 4 },
  { hour: '10:00', requests: 7 },
  { hour: '11:00', requests: 9 },
  { hour: '12:00', requests: 5 },
  { hour: '13:00', requests: 3 },
  { hour: '14:00', requests: 8 },
  { hour: '15:00', requests: 6 },
  { hour: '16:00', requests: 5 },
];
