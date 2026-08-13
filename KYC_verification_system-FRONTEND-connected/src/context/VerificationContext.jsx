import React, { createContext, useContext, useState, useEffect } from 'react';

const VerificationContext = createContext(null);

export function VerificationProvider({ children }) {
  const [verificationData, setVerificationData] = useState(() => {
    try {
      const saved = localStorage.getItem('kyc_verification_store_v2');
      return saved ? JSON.parse(saved) : {
        aadhaarVerified: false,
        panVerified: false,
        selfieVerified: false,
        reviewReady: false,
        aadhaarData: null,
        panData: null,
        selfieData: null
      };
    } catch {
      return {
        aadhaarVerified: false,
        panVerified: false,
        selfieVerified: false,
        reviewReady: false,
        aadhaarData: null,
        panData: null,
        selfieData: null
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kyc_verification_store_v2', JSON.stringify(verificationData));
    } catch (err) {
      console.error('Error saving verification store:', err);
    }
  }, [verificationData]);

  // Method 1: Save Aadhaar Verification Data
  const markAadhaarVerified = (data) => {
    setVerificationData(prev => ({
      ...prev,
      aadhaarVerified: true,
      aadhaarData: {
        fullName: data.name || 'Verified Holder',
        dateOfBirth: data.dob || '15/08/1995',
        gender: data.gender || 'Male',
        maskedAadhaar: data.last4 ? `XXXX XXXX ${data.last4}` : 'XXXX XXXX 9012',
        verificationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
  };

  // Method 2: Save PAN Verification Data
  const markPanVerified = (data) => {
    setVerificationData(prev => ({
      ...prev,
      panVerified: true,
      panData: {
        panNumber: data.maskedPan || 'ABCDE1234F',
        fullName: data.name || 'Verified Cardholder',
        panMatched: true,
        verificationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
  };

  // Method 3: Save Selfie Verification Data
  const markSelfieVerified = (data) => {
    const isPassed = (data.face_match !== false) && (!data.deepfake_detected);
    setVerificationData(prev => ({
      ...prev,
      selfieVerified: isPassed,
      selfieData: {
        confidenceScore: data.liveness_score ? Math.round(data.liveness_score * 100) : 98,
        livenessPassed: true,
        deepfakePassed: !data.deepfake_detected,
        faceMatched: data.face_match !== false,
        capturedSelfieUrl: data.capturedSelfieUrl || null,
        verificationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }));
  };

  // Method 4: Toggle Review Ready State (called when both consent checkboxes checked)
  const setReviewReadyState = (isReady) => {
    setVerificationData(prev => ({
      ...prev,
      reviewReady: isReady
    }));
  };

  // Automatic Workflow Progress Calculation
  const aadhaarVerified = verificationData.aadhaarVerified;
  const panVerified = verificationData.panVerified;
  const selfieVerified = verificationData.selfieVerified;
  const reviewReady = verificationData.reviewReady;

  const completedStepsList = [aadhaarVerified, panVerified, selfieVerified, reviewReady];
  const completedSteps = completedStepsList.filter(Boolean).length;
  const totalSteps = 4;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <VerificationContext.Provider value={{
      verificationData,
      aadhaarVerified,
      panVerified,
      selfieVerified,
      reviewReady,
      completedSteps,
      totalSteps,
      percentage,
      markAadhaarVerified,
      markPanVerified,
      markSelfieVerified,
      setReviewReadyState
    }}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}
