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
import { API_LATENCY_MS } from '../constants';
import {
  mockQueue,
  mockApplicantDetails,
  mockVerificationStatus,
  mockFaceData,
  mockVerificationResult,
  mockActivities,
  mockDashboardStats,
  mockTrendData,
  mockStatusDistribution,
  mockHourlyData,
} from './mockData';

function delay(ms: number = API_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { data, message, success: true };
}

function apiError(message: string): Error {
  return new Error(message);
}

export const verificationService = {
  async getVerificationQueue(): Promise<ApiResponse<VerificationRequest[]>> {
    await delay();
    return ok([...mockQueue]);
  },

  async getApplicantDetails(
    referenceId: string,
  ): Promise<ApiResponse<ApplicantDetails>> {
    await delay();
    const data = mockApplicantDetails[referenceId];
    if (!data) throw apiError('Applicant not found');
    return ok({ ...data });
  },

  async getGovernmentDetails(
    referenceId: string,
  ): Promise<ApiResponse<ApplicantDetails['government']>> {
    await delay();
    const data = mockApplicantDetails[referenceId];
    if (!data) throw apiError('Government details not found');
    return ok({ ...data.government });
  },

  async getVerificationStatus(
    referenceId: string,
  ): Promise<ApiResponse<VerificationStatusData>> {
    await delay(300);
    const data = mockVerificationStatus[referenceId];
    if (!data) throw apiError('Verification status not found');
    return ok({ ...data });
  },

  async getFaceVerification(
    referenceId: string,
  ): Promise<ApiResponse<FaceVerificationData>> {
    await delay();
    const data = mockFaceData[referenceId];
    if (!data) throw apiError('Face verification data not found');
    return ok({ ...data });
  },

  async getVerificationResult(
    referenceId: string,
  ): Promise<ApiResponse<VerificationResult>> {
    await delay();
    const data = mockVerificationResult[referenceId];
    if (!data) throw apiError('Verification result not found');
    return ok({ ...data });
  },

  async approveVerification(
    referenceId: string,
  ): Promise<ApiResponse<{ referenceId: string; status: string }>> {
    await delay();
    const item = mockQueue.find((v) => v.referenceId === referenceId);
    if (!item) throw apiError('Verification not found');
    item.status = 'approved';
    return ok({ referenceId, status: 'approved' }, 'Verification approved');
  },

  async rejectVerification(
    referenceId: string,
  ): Promise<ApiResponse<{ referenceId: string; status: string }>> {
    await delay();
    const item = mockQueue.find((v) => v.referenceId === referenceId);
    if (!item) throw apiError('Verification not found');
    item.status = 'rejected';
    return ok({ referenceId, status: 'rejected' }, 'Verification rejected');
  },

  async getActivities(): Promise<ApiResponse<ActivityItem[]>> {
    await delay(400);
    return ok([...mockActivities]);
  },

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await delay(300);
    return ok({ ...mockDashboardStats });
  },

  async getTrendData(): Promise<ApiResponse<TrendDataPoint[]>> {
    await delay(400);
    return ok([...mockTrendData]);
  },

  async getStatusDistribution(): Promise<ApiResponse<StatusDistribution[]>> {
    await delay(400);
    return ok([...mockStatusDistribution]);
  },

  async getHourlyData(): Promise<ApiResponse<HourlyDataPoint[]>> {
    await delay(400);
    return ok([...mockHourlyData]);
  },
};

export const authService = {
  async signIn(username: string, password: string): Promise<ApiResponse<AuthUser>> {
    await delay();
    if (!username || !password) throw apiError('Username and password are required');
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
