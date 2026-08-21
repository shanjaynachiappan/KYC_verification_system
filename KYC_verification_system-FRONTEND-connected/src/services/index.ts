import type {
  ApiResponse,
  AuthUser,
  VerificationRequest,
  ApplicantDetails,
  VerificationStatusData,
  FaceVerificationData,
  VerificationResult,
  ActivityItem,
  DashboardStats,
  TrendDataPoint,
  StatusDistribution,
  HourlyDataPoint,
} from '../types';
import { apiClient } from './apiClient';

/*
 * Real backend wiring. Every call below hits the FastAPI /review/* router
 * (see app/routers/review.py in the backend repo), which aggregates the
 * onboarding-pipeline DB (users/documents/verification_status/aml_results)
 * into exactly these shapes -- so no mapping/transformation is needed here.
 *
 * authService below is intentionally still client-side only: the backend
 * has no login/password system by design (identity verification IS the
 * authentication for applicants; there's no separate officer-auth backend
 * built for this hackathon scope). If you need real officer login later,
 * that's new backend work, not a frontend wiring change.
 */

function ok<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { data, message, success: true };
}

export const verificationService = {
  async getVerificationQueue(): Promise<ApiResponse<VerificationRequest[]>> {
    const res = await apiClient.get<VerificationRequest[]>('/review/queue');
    return ok(res.data);
  },

  async getApplicantDetails(
    referenceId: string,
  ): Promise<ApiResponse<ApplicantDetails>> {
    const res = await apiClient.get<ApplicantDetails>(`/review/${referenceId}`);
    return ok(res.data);
  },

  async getGovernmentDetails(
    referenceId: string,
  ): Promise<ApiResponse<ApplicantDetails['government']>> {
    const res = await apiClient.get<ApplicantDetails>(`/review/${referenceId}`);
    return ok(res.data.government);
  },

  async getVerificationStatus(
    referenceId: string,
  ): Promise<ApiResponse<VerificationStatusData>> {
    const res = await apiClient.get<VerificationStatusData>(`/review/${referenceId}/status`);
    return ok(res.data);
  },

  async getFaceVerification(
    referenceId: string,
  ): Promise<ApiResponse<FaceVerificationData>> {
    const res = await apiClient.get<FaceVerificationData>(`/review/${referenceId}/face`);
    return ok(res.data);
  },

  async getVerificationResult(
    referenceId: string,
  ): Promise<ApiResponse<VerificationResult>> {
    const res = await apiClient.get<VerificationResult>(`/review/${referenceId}/result`);
    return ok(res.data);
  },

  async approveVerification(
    referenceId: string,
  ): Promise<ApiResponse<{ referenceId: string; status: string }>> {
    const res = await apiClient.post(`/review/${referenceId}/decision`, {
      decision: 'approved',
    });
    return ok(res.data, 'Verification approved');
  },

  async rejectVerification(
    referenceId: string,
  ): Promise<ApiResponse<{ referenceId: string; status: string }>> {
    const res = await apiClient.post(`/review/${referenceId}/decision`, {
      decision: 'rejected',
    });
    return ok(res.data, 'Verification rejected');
  },

  async getActivities(): Promise<ApiResponse<ActivityItem[]>> {
    const res = await apiClient.get<ActivityItem[]>('/review/dashboard/activities');
    return ok(res.data);
  },

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const res = await apiClient.get<DashboardStats>('/review/dashboard/stats');
    return ok(res.data);
  },

  async getTrendData(): Promise<ApiResponse<TrendDataPoint[]>> {
    const res = await apiClient.get<TrendDataPoint[]>('/review/dashboard/trend');
    return ok(res.data);
  },

  async getStatusDistribution(): Promise<ApiResponse<StatusDistribution[]>> {
    const res = await apiClient.get<StatusDistribution[]>('/review/dashboard/distribution');
    return ok(res.data);
  },

  async getHourlyData(): Promise<ApiResponse<HourlyDataPoint[]>> {
    const res = await apiClient.get<HourlyDataPoint[]>('/review/dashboard/hourly');
    return ok(res.data);
  },
};

// Kept mocked on purpose -- see file header comment.
export const authService = {
  async signIn(username: string, password: string): Promise<ApiResponse<AuthUser>> {
    if (!username || !password) throw new Error('Username and password are required');
    const user: AuthUser = {
      id: 'usr_001',
      username,
      email: `${username}@verifyline.io`,
      role: 'Compliance Officer',
      department: 'KYC Operations',
      name: 'Aditya Menon',
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem('verifyline_token', `mock_token_${Date.now()}`);
    return ok(user, 'Signed in successfully');
  },

  signOut(): void {
    localStorage.removeItem('verifyline_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('verifyline_token');
  },
};
