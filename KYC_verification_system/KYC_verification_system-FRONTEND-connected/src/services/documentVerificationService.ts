import type {
  PassportExtractionResult,
  PayslipExtractionResult,
  DeepfakeCheckResult,
  AiGeneratedCheckResult,
  ApiResponse,
} from '../types';
import { apiClient } from './apiClient';

/*
 * Service layer for the 4 endpoints added by the deepfake-detection branch:
 *   POST /passport/extract   -- OCR + field extraction from a passport image
 *   POST /payslip/extract    -- OCR + field extraction from a payslip image
 *   POST /deepfake/image     -- selfie deepfake check (Xception model)
 *   POST /ai-generated/image -- selfie AI-generation check (SigLIP model)
 *
 * These are file-upload (multipart/form-data) endpoints, unlike every other
 * service in this folder which calls JSON endpoints on /review/*. There is
 * currently NO PAGE in this frontend that calls them -- this app is the
 * officer/compliance REVIEW dashboard (see services/index.ts's header
 * comment); it consumes already-submitted applicant data, it doesn't
 * collect new document/selfie uploads from an applicant.
 *
 * Where these would plug in: the natural fit is an "on-demand re-check"
 * panel on WorkspacePage (e.g. an officer suspects a submitted passport
 * photo or selfie and wants to re-run OCR/deepfake detection on it) -- but
 * that requires WorkspacePage to actually hold/upload a File, which it
 * currently doesn't. Wiring that up is a UI task, not just a service-layer
 * one; not attempted here since guessing WorkspacePage's actual layout
 * risks breaking a working page. This file gets you the typed, tested
 * calling code -- the remaining work is adding a file-input + button
 * somewhere that calls one of these functions with the picked File.
 *
 * Backend notes worth knowing before wiring a page to these:
 *   - /deepfake/image needs a local model weights file
 *     (app/services/deepfake/weights/xception_ffpp.pth) that is NOT in the
 *     repo. Until it's added, this endpoint returns HTTP 500/503 -- handle
 *     that in the UI (show "detection unavailable", don't treat it as a
 *     hard reject).
 *   - /ai-generated/image auto-downloads its model from Hugging Face Hub on
 *     first server startup (~350-400MB) -- the first real call after a
 *     fresh server start may be slow while that finishes.
 *   - All 4 expect a single image file field named "file" (JPEG or PNG).
 */

function ok<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { data, message, success: true };
}

function toFormData(file: File): FormData {
  const form = new FormData();
  form.append('file', file);
  return form;
}

// apiClient defaults to Content-Type: application/json (see apiClient.ts).
// For file uploads that default must be cleared per-request -- otherwise it
// can override the multipart boundary the browser needs to set itself,
// and the backend (FastAPI's UploadFile) won't be able to parse the body.
const multipartConfig = { headers: { 'Content-Type': undefined } };

export const documentVerificationService = {
  async extractPassport(file: File): Promise<ApiResponse<PassportExtractionResult>> {
    const res = await apiClient.post<PassportExtractionResult>(
      '/passport/extract',
      toFormData(file),
      { ...multipartConfig, timeout: 30000 },
    );
    return ok(res.data);
  },

  async extractPayslip(file: File): Promise<ApiResponse<PayslipExtractionResult>> {
    const res = await apiClient.post<PayslipExtractionResult>(
      '/payslip/extract',
      toFormData(file),
      { ...multipartConfig, timeout: 30000 },
    );
    return ok(res.data);
  },

  async checkDeepfake(file: File): Promise<ApiResponse<DeepfakeCheckResult>> {
    const res = await apiClient.post<DeepfakeCheckResult>(
      '/deepfake/image',
      toFormData(file),
      { ...multipartConfig, timeout: 30000 },
    );
    return ok(res.data);
  },

  async checkAiGenerated(file: File): Promise<ApiResponse<AiGeneratedCheckResult>> {
    const res = await apiClient.post<AiGeneratedCheckResult>(
      '/ai-generated/image',
      toFormData(file),
      // longer timeout: first call after a fresh server start may still be
      // downloading the model from Hugging Face Hub
      { ...multipartConfig, timeout: 60000 },
    );
    return ok(res.data);
  },
};
