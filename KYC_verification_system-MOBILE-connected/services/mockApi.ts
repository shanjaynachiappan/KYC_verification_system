import { AuthCredentials, IdentityPayload, IdentityResponse } from '@/types';

// Simulated network delay
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export async function mockSignIn(credentials: AuthCredentials): Promise<{ success: boolean; message: string }> {
  await delay(900);
  if (!credentials.username || !credentials.password) {
    return { success: false, message: 'Username and password are required.' };
  }
  if (credentials.password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  return { success: true, message: 'Signed in successfully.' };
}

export async function mockSignUp(credentials: AuthCredentials): Promise<{ success: boolean; message: string }> {
  await delay(1000);
  if (!credentials.username || !credentials.password) {
    return { success: false, message: 'All fields are required.' };
  }
  if (credentials.password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }
  return { success: true, message: 'Account created successfully.' };
}

// POST /api/identity – mock placeholder
export async function postIdentity(payload: IdentityPayload): Promise<IdentityResponse> {
  await delay(800);
  const aadhaarValid = /^\d{12}$/.test(payload.aadhaarNumber.replace(/\s/g, ''));
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(payload.panNumber.toUpperCase());

  if (!aadhaarValid) {
    return { success: false, message: 'Invalid Aadhaar number. Must be 12 digits.' };
  }
  if (!panValid) {
    return { success: false, message: 'Invalid PAN number. Format: ABCDE1234F' };
  }

  return {
    success: true,
    message: 'Identity submitted for verification.',
    verificationId: 'VRF-' + Date.now().toString(36).toUpperCase(),
  };
}
