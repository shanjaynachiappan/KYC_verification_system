export type VerificationStatus =
  | 'pending'
  | 'in_review'
  | 'processing'
  | 'approved'
  | 'rejected';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkflowStageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type WorkflowStageName =
  | 'aadhaar_validation'
  | 'pan_validation'
  | 'government_ekyc'
  | 'aml_screening'
  | 'face_verification';

export interface VerificationRequest {
  id: string;
  referenceId: string;
  applicantName: string;
  aadhaarNumber: string;
  panNumber: string;
  submissionTime: string;
  priority: Priority;
  status: VerificationStatus;
}

export interface GovernmentDetails {
  name: string;
  dob: string;
  gender: string;
  address: string;
  aadhaarVerified: boolean;
  panVerified: boolean;
}

export interface ApplicantDetails {
  referenceId: string;
  applicantName: string;
  aadhaarNumber: string;
  panNumber: string;
  submissionTime: string;
  government: GovernmentDetails;
}

export interface WorkflowStage {
  name: WorkflowStageName;
  label: string;
  status: WorkflowStageStatus;
  timestamp: string | null;
}

export interface VerificationStatusData {
  referenceId: string;
  stages: WorkflowStage[];
  progress: number;
  currentStage: string;
  statusMessages: string[];
}

export interface FaceVerificationData {
  referenceId: string;
  selfieUrl: string | null;
  governmentPhotoUrl: string | null;
  matchScore: number;
  similarityPercentage: number;
  faceVerificationStatus: 'pending' | 'matched' | 'not_matched';
  livenessStatus: 'pending' | 'live' | 'failed';
}

export interface VerificationResult {
  referenceId: string;
  applicantName: string;
  aadhaarNumber: string;
  panNumber: string;
  governmentVerification: {
    aadhaarVerified: boolean;
    panVerified: boolean;
    aadhaarLinkedToPan: boolean;
  };
  amlResult: {
    status: 'clear' | 'flagged' | 'review';
    riskScore: number;
    matches: number;
  };
  faceMatchResult: {
    score: number;
    status: 'matched' | 'not_matched';
    liveness: 'live' | 'failed';
  };
  decision: VerificationStatus;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  department: string;
  name: string;
  lastLogin: string;
}

export interface ActivityItem {
  id: string;
  type: 'approved' | 'rejected' | 'submitted' | 'processing';
  referenceId: string;
  applicantName: string;
  adminName: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface DashboardStats {
  todayRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  avgProcessingTime: string;
  successRate: number;
}

export interface TrendDataPoint {
  date: string;
  total: number;
  approved: number;
  rejected: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface HourlyDataPoint {
  hour: string;
  requests: number;
}
