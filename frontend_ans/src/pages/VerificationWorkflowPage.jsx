import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, FileText, Camera, UserCheck, 
  CheckCircle2, ArrowRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import StepItem from '../components/StepItem';
import '../styles/verification-workflow.css';

const STEPS_DATA = [
  {
    id: 'aadhaar',
    title: 'Identity Verification',
    desc: 'Verify your Aadhaar details seamlessly using DigiLocker or fast OTP verification.',
    estimatedTime: 'Takes ~30 seconds',
    icon: CreditCard
  },
  {
    id: 'pan',
    title: 'PAN Verification',
    desc: 'Validate your PAN identity against official government tax records.',
    estimatedTime: 'Takes ~20 seconds',
    icon: FileText
  },
  {
    id: 'selfie',
    title: 'Live Selfie Verification',
    desc: 'Capture a live facial scan for AI-powered biometrics and liveness detection.',
    estimatedTime: 'Takes ~45 seconds',
    icon: Camera
  },
  {
    id: 'profile',
    title: 'Final Review',
    desc: 'Review all submitted verification tokens and confirm final account activation.',
    estimatedTime: 'Takes ~10 seconds',
    icon: UserCheck
  }
];

export default function VerificationWorkflowPage() {
  const { user } = useAuth();
  const { 
    aadhaarVerified, 
    panVerified, 
    selfieVerified, 
    reviewReady,
    markAadhaarVerified,
    markPanVerified,
    markSelfieVerified,
    setReviewReadyState,
    resetVerificationState
  } = useVerification();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Derive activeStepIndex strictly from verified status flags
  let activeStepIndex = 0;
  if (aadhaarVerified) activeStepIndex = 1;
  if (aadhaarVerified && panVerified) activeStepIndex = 2;
  if (aadhaarVerified && panVerified && selfieVerified) activeStepIndex = 3;
  if (aadhaarVerified && panVerified && selfieVerified && reviewReady) activeStepIndex = 4;

  const totalSteps = STEPS_DATA.length;
  const isAllCompleted = activeStepIndex >= totalSteps;
  const currentDisplayStep = isAllCompleted ? totalSteps : activeStepIndex + 1;
  const progressPercent = Math.min(100, Math.round((activeStepIndex / totalSteps) * 100));

  const handleContinueStep = (stepId, stepIndex) => {
    navigate('/verify/documents', { state: { stepId, stepIndex } });
  };

  const handleCompleteVerification = () => {
    if (isAllCompleted) {
      navigate('/dashboard');
    }
  };

  const handleQuickAdvance = () => {
    if (!aadhaarVerified) {
      markAadhaarVerified({ name: user?.username || 'Verified Holder' });
    } else if (!panVerified) {
      markPanVerified({ name: user?.username || 'Verified Holder' });
    } else if (!selfieVerified) {
      markSelfieVerified({ face_match: true });
    } else if (!reviewReady) {
      setReviewReadyState(true);
    }
  };

  const handleQuickCompleteAll = () => {
    markAadhaarVerified({ name: user?.username || 'Verified Holder' });
    markPanVerified({ name: user?.username || 'Verified Holder' });
    markSelfieVerified({ face_match: true });
    setReviewReadyState(true);
  };

  const handleResetDemo = () => {
    resetVerificationState();
  };

  const usernameDisplay = user?.username || 'Shanjaynachiappan';

  return (
    <div className="fintech-layout">
      {/* Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Grid: Sidebar + Body + Right Panel */}
      <div className="fintech-dashboard-grid">
        <SidebarNav isOpen={isSidebarOpen} />

        <main className="fintech-main-content">
          {/* Horizontal KYC Stepper */}
          <KycStepper activeStepIndex={activeStepIndex} />

          {/* Page Heading */}
          <section className="page-header-section">
            <h1 className="page-title">Identity Verification</h1>
            <p className="page-subtitle">
              Please complete the verification steps below to activate your VerifyPay account, <strong>{usernameDisplay}</strong>.
            </p>
          </section>

          {/* Progress Card */}
          <section className="fintech-progress-card">
            <div className="progress-text-row">
              <span className="step-progress-label">
                {isAllCompleted ? 'All steps completed' : `Step ${currentDisplayStep} of ${totalSteps} in progress`}
              </span>
              <span className="step-progress-percent">{progressPercent}% Completed</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>

          {/* Vertical Steps List */}
          <section className="steps-cards-stack">
            {STEPS_DATA.map((step, idx) => (
              <StepItem
                key={step.id}
                step={step}
                index={idx}
                activeStepIndex={activeStepIndex}
                onContinueStep={handleContinueStep}
              />
            ))}
          </section>

          {/* Complete Verification Action Section */}
          <section className="complete-action-section">
            <button 
              className={`primary-submit-btn ${isAllCompleted ? 'enabled' : 'disabled'}`}
              disabled={!isAllCompleted}
              onClick={handleCompleteVerification}
            >
              {isAllCompleted ? <CheckCircle2 size={18} /> : <Lock size={16} />}
              <span>Complete Verification</span>
              <ArrowRight size={18} />
            </button>

            <p className="action-helper-text">
              {isAllCompleted 
                ? 'All required steps completed! Click above to enter your active account dashboard.' 
                : 'Complete all steps above to unlock account activation.'}
            </p>

            {/* Quick Demo Assist Controls */}
            <div className="demo-controls-bar">
              {!isAllCompleted ? (
                <>
                  <button type="button" onClick={handleQuickAdvance} className="demo-btn">
                    [Demo: Pass Step {currentDisplayStep}]
                  </button>
                  <button type="button" onClick={handleQuickCompleteAll} className="demo-btn highlight">
                    [Demo: Pass All Steps]
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleResetDemo} className="demo-btn">
                  [Reset Demo Workflow]
                </button>
              )}
            </div>
          </section>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
