/**
 * Real backend client for the FastAPI KYC/AML service.
 * Replaces services/mockApi.ts's fabricated responses with actual HTTP calls.
 *
 * Base URL comes from EXPO_PUBLIC_API_BASE_URL (Expo only exposes env vars
 * prefixed EXPO_PUBLIC_ to client bundles -- see .env.example).
 *
 * IMPORTANT for physical devices / Expo Go: "localhost" means the phone
 * itself, not your laptop. Set EXPO_PUBLIC_API_BASE_URL to your machine's
 * LAN IP (e.g. http://192.168.1.42:8000) when testing on a real device.
 * localhost/127.0.0.1 only works in a browser (Expo web) or an iOS
 * Simulator/Android Emulator with the right port-forwarding.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8000';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON -- fall back to the generic message above
    }
    throw new Error(detail);
  }
  return res.json();
}

// ---------- users ----------

export interface UserCreateResponse {
  user_id: string;
  session_id: string;
}

export async function createUser(): Promise<UserCreateResponse> {
  const res = await fetch(`${API_BASE_URL}/users/`, { method: 'POST' });
  return handle(res);
}

// ---------- PAN ----------

export interface PanVerifyResponse {
  valid: boolean;
  full_name: string | null;
  category: string | null;
  aadhaar_seeding_status: string | null;
  message: string;
  verified_at: string;
}

export async function verifyPan(userId: string, pan: string): Promise<PanVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/pan/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, pan }),
  });
  return handle(res);
}

// ---------- DigiLocker / eKYC ----------

export interface DigilockerInitResponse {
  request_id: string;
  redirect_url: string;
}

export async function initDigilocker(userId: string): Promise<DigilockerInitResponse> {
  const res = await fetch(`${API_BASE_URL}/ekyc/digilocker/init/${userId}`, { method: 'POST' });
  return handle(res);
}

export interface DigilockerStatusResponse {
  request_id: string;
  consent_status: 'unauthenticated' | 'authenticated' | 'expired';
}

export async function getDigilockerStatus(requestId: string): Promise<DigilockerStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/ekyc/digilocker/status/${requestId}`);
  return handle(res);
}

export interface AadhaarFetchResponse {
  name: string | null;
  dob: string | null;
  address: string | null;
  photo_base64: string | null;
  id_number_masked: string | null;
  fetched_at: string;
}

export async function fetchAadhaar(requestId: string): Promise<AadhaarFetchResponse> {
  const res = await fetch(`${API_BASE_URL}/ekyc/digilocker/fetch-aadhaar/${requestId}`, {
    method: 'POST',
  });
  return handle(res);
}

/** Polls DigiLocker consent status until authenticated, or throws after maxAttempts. */
export async function waitForDigilockerConsent(
  requestId: string,
  { maxAttempts = 20, intervalMs = 3000 }: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { consent_status } = await getDigilockerStatus(requestId);
    if (consent_status === 'authenticated') return;
    if (consent_status === 'expired') throw new Error('DigiLocker consent expired. Please try again.');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Timed out waiting for DigiLocker consent. Please try again.');
}

export interface CrossCheckResponse {
  matched: boolean;
  name_similarity: number;
  aadhaar_name: string | null;
  pan_name: string | null;
  checked_at: string;
}

export async function crossCheck(userId: string): Promise<CrossCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/ekyc/cross-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  return handle(res);
}

// ---------- AML ----------

export interface AmlScreenResponse {
  matched: boolean;
  best_score: number;
  matches: { matched_name: string; score: number; topics: string; source_dataset: string }[];
  checked_at: string;
}

export async function screenAml(userId: string, name: string): Promise<AmlScreenResponse> {
  const res = await fetch(`${API_BASE_URL}/aml/screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name }),
  });
  return handle(res);
}

// ---------- Status ----------

export interface StatusResponse {
  user_id: string;
  state: string;
  cross_check_passed: boolean | null;
  face_match_passed: boolean | null;
  aml_flagged: boolean | null;
  final_status: 'verified' | 'flagged' | 'pending' | null;
  updated_at: string;
}

export async function getStatus(userId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status/${userId}`);
  return handle(res);
}

// ---------- Selfie quality gate (OpenCV, Member A) ----------

export interface SelfieUploadResponse {
  status: 'accepted' | 'rejected';
  message: string;
  face_count?: number;
  blur_score?: number;
  bright_pixel_percentage?: number;
}

/** uri is a local file:// URI from expo-image-picker (Camera capture). */
export async function uploadSelfieForQualityCheck(uri: string): Promise<SelfieUploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'selfie.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/selfie/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: formData,
  });
  return handle(res);
}

// ---------- Face match (DeepFace ArcFace vs Aadhaar photo) ----------

export interface FaceMatchResponse {
  matched: boolean;
  similarity_score: number;
  quality_issue: string | null;
  checked_at: string;
}

export async function matchFace(userId: string, selfieBase64: string): Promise<FaceMatchResponse> {
  const res = await fetch(`${API_BASE_URL}/face/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, selfie_base64: selfieBase64 }),
  });
  return handle(res);
}

// ---------- Supporting document OCR (Member A) ----------

export interface OcrUploadResponse {
  status: 'success' | 'rejected';
  message: string;
  filename?: string;
  blur_score?: number;
  is_blurry?: boolean;
  bright_pixel_percentage?: number;
  is_overexposed?: boolean;
  extracted_text?: string[];
  full_text?: string;
}

/** uri/name/mimeType come straight from expo-image-picker's picked asset. */
export async function uploadDocumentForOcr(
  uri: string,
  name: string,
  mimeType: string,
): Promise<OcrUploadResponse> {
  const formData = new FormData();
  formData.append('file', { uri, name, type: mimeType } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/ocr/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: formData,
  });
  return handle(res);
}
