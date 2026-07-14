export interface AuthCredentials {
  username: string;
  password: string;
}

export interface IdentityPayload {
  aadhaarNumber: string;
  panNumber: string;
}

export interface IdentityResponse {
  success: boolean;
  message: string;
  verificationId?: string;
}

export type VerificationStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
};
