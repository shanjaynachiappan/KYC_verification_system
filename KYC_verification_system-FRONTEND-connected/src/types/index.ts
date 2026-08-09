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

/*
 * Document/AI-detection endpoint types below.
 *
 * Unlike the types above (which mirror /review/* -- pre-aggregated into
 * frontend-friendly camelCase, see services/index.ts's header comment),
 * these mirror the RAW JSON shape /passport, /payslip, /deepfake, and
 * /ai-generated actually return -- snake_case, straight from the Python
 * backend, no transformation layer. There is currently no page in this
 * frontend that calls them (this dashboard is officer/review-only; these
 * 4 endpoints are file-upload checks with no applicant-facing upload flow
 * built yet). Service functions are provided in
 * services/documentVerificationService.ts, ready to call once a page
 * needs them -- see that file's header comment for where they'd plug in.
 */

export interface ImageQualityResult {
  is_blurry: boolean;
  blur_score: number;
  threshold: number;
}

export interface DocumentQualityCheck {
  is_valid: boolean;
  blur: ImageQualityResult;
  glare: {
    is_glare: boolean;
    glare_percentage: number;
  };
  resolution: {
    is_low_resolution: boolean;
    width: number;
    height: number;
  };
}

export interface OcrResult {
  text_found: boolean;
  extracted_text: string[];
  full_text: string;
}

export interface PassportExtractedData {
  passport_number: string | null;
  name: string | null;
  date_of_birth: string | null;
  date_of_expiry: string | null;
  gender: string | null;
  nationality: string | null;
  place_of_birth: string | null;
  place_of_issue: string | null;
  [key: string]: unknown;
}

export interface PassportExtractionResult {
  success: boolean;
  stage?: 'image_quality' | 'ocr';
  message?: string;
  document_type?: 'passport';
  quality_result?: DocumentQualityCheck;
  ocr?: OcrResult;
  validation?: { is_valid: boolean; [key: string]: unknown };
  data?: PassportExtractedData;
}

export interface PayslipExtractedData {
  employee_name: string | null;
  employee_id: string | null;
  company_name: string | null;
  designation: string | null;
  department: string | null;
  pay_period: string | null;
  [key: string]: unknown;
}

export interface PayslipExtractionResult {
  success: boolean;
  stage?: 'image_quality' | 'ocr';
  message?: string;
  document_type?: 'payslip';
  quality_result?: DocumentQualityCheck;
  ocr?: OcrResult;
  validation?: { is_valid: boolean; [key: string]: unknown };
  data?: PayslipExtractedData;
}

export interface DeepfakeCheckResult {
  prediction: 'Real' | 'Fake';
  confidence: number;
}

export interface AiGeneratedCheckResult {
  prediction: 'Real' | 'AI Generated';
  confidence: number;
}
