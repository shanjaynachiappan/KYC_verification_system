import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// User Creation
export const createUser = async () => {
  const response = await API.post("/users/");
  return response.data;
};

// Initialize DigiLocker
export const initDigilocker = async (userId) => {
  const response = await API.post(`/ekyc/digilocker/init/${userId}`);
  return response.data;
};

// Check DigiLocker Status
export const getDigilockerStatus = async (requestId) => {
  const response = await API.get(`/ekyc/digilocker/status/${requestId}`);
  return response.data;
};

// Fetch Aadhaar details after authentication
export const fetchAadhaar = async (requestId) => {
  const response = await API.post(`/ekyc/digilocker/fetch-aadhaar/${requestId}`);
  return response.data;
};

// PAN Verification
export const verifyPan = async (userId, panNumber, reason = "Identity verification during onboarding") => {
  const response = await API.post("/pan/verify", {
    user_id: userId,
    pan: panNumber,
    reason: reason
  });
  return response.data;
};

// Identity Cross-Check (Aadhaar ↔ PAN)
export const crossCheck = async (userId) => {
  const response = await API.post("/ekyc/cross-check", {
    user_id: userId
  });
  return response.data;
};

// Deepfake / AI Image Detection
export const detectDeepfake = async (imageBlob, source = "live") => {
  const formData = new FormData();
  formData.append("file", imageBlob, "selfie.jpg");
  formData.append("source", source);
  const response = await API.post("/deepfake/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

// Face Matching against Aadhaar Photo
export const matchFace = async (userId, selfieBase64, source = "live", deepfakePrediction = null, deepfakeConfidence = null) => {
  const response = await API.post("/face/match", {
    user_id: userId,
    selfie_base64: selfieBase64,
    source: source,
    deepfake_prediction: deepfakePrediction,
    deepfake_confidence: deepfakeConfidence
  });
  return response.data;
};

export const createAgentSession = async (userId, reason) => {
  const response = await API.post("/agent/sessions", { user_id: userId, reason });
  return response.data;
};

export const getAgentSession = async (sessionId) => {
  const response = await API.get(`/agent/sessions/${sessionId}`);
  return response.data;
};

export const listAgentSessions = async (statusFilter = null) => {
  const response = await API.get("/agent/sessions", { params: statusFilter ? { status_filter: statusFilter } : {} });
  return response.data;
};

export const claimAgentSession = async (sessionId, agentName) => {
  const response = await API.post(`/agent/sessions/${sessionId}/claim`, { agent_name: agentName });
  return response.data;
};

export const submitAgentDecision = async (sessionId, decision, notes) => {
  const response = await API.post(`/agent/sessions/${sessionId}/decision`, { decision, notes });
  return response.data;
};

export const getAgentMessages = async (sessionId) => {
  const response = await API.get(`/agent/sessions/${sessionId}/messages`);
  return response.data;
};

export const buildAgentWsUrl = (sessionId, role) => {
  const httpBase = API.defaults.baseURL || "http://localhost:8000";
  const wsBase = httpBase.replace(/^http/, "ws");
  return `${wsBase}/agent/ws/${sessionId}/${role}`;
};

export const runAmlCheck = async (userId, name) => {
  const response = await API.post("/aml/screen", {
    user_id: userId,
    name: name,
    declared_income_band: declaredIncomeBand,
    declared_source: declaredSource
  });
  return response.data;
};

export default API;
