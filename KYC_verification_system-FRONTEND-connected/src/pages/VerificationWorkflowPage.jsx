import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, FileText, Camera, UserCheck, 
  LogOut, CheckCircle2, ArrowRight, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import StepItem from '../components/StepItem';
import '../styles/verification-workflow.css';

const STEPS_DATA = [
  {
    id: 'aadhaar',
    title: 'Aadhaar Verification',
    desc: 'Verify your Aadhaar details seamlessly using DigiLocker or fast OTP verification.',
    estimatedTime: 'Takes ~30 seconds',
    icon: CreditCard
  },
  {
    id: 'pan',
    title: 'PAN Verification',
    desc: 'Validate your PAN identity against official NSDL government tax records.',
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active step index (0 to 4)
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    try {
      const savedIndex = localStorage.getItem(`kyc_workflow_step_${user?.username}`);
      return savedIndex !== null ? parseInt(savedIndex, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (user?.username) {
      localStorage.setItem(`kyc_workflow_step_${user.username}`, activeStepIndex.toString());
    }
  }, [activeStepIndex, user]);

  const totalSteps = STEPS_DATA.length;
  const isAllCompleted = activeStepIndex >= totalSteps;
  const currentDisplayStep = isAllCompleted ? totalSteps : activeStepIndex + 1;
  const progressPercent = Math.min(100, Math.round((activeStepIndex / totalSteps) * 100));

  const handleContinueStep = (stepId, stepIndex) => {
    navigate('/verify/documents', { state: { stepId, stepIndex } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCompleteVerification = () => {
    if (isAllCompleted) {
      navigate('/dashboard');
    }
  };

  const handleQuickAdvance = () => {
    if (activeStepIndex < totalSteps) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handleQuickCompleteAll = () => {
    setActiveStepIndex(totalSteps);
  };

  const handleResetDemo = () => {
    setActiveStepIndex(0);
  };

  return (
    <div className="workflow-container">
      {/* Ambient Background Glows */}
      <div className="bg-glow-orb glow-top-left"></div>
      <div className="bg-glow-orb glow-bottom-right"></div>

      {/* Top Header Bar */}
      <header className="workflow-header">
        <Logo size="small" />

        <div className="header-right">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="username-text">{user?.username || 'Member'}</span>
          </div>

          <ThemeToggle />

          <button className="workflow-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workflow Container */}
      <main className="workflow-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="workflow-heading">Let’s verify your account</h1>
          <p className="workflow-subheading">
            Complete the following steps to activate your VerifyPay account, <strong>{user?.username}</strong>.
          </p>
        </section>

        {/* Progress Bar Card */}
        <section className="progress-card">
          <div className="progress-header-row">
            <span className="step-count-text">
              {isAllCompleted ? 'All 4 steps completed' : `Step ${currentDisplayStep} of ${totalSteps}`}
            </span>
            <span className="percent-text">{progressPercent}%</span>
          </div>
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </section>

        {/* Timeline Stepper */}
        <section className="timeline-stepper">
          {STEPS_DATA.map((step, idx) => (
            <StepItem
              key={step.id}
              step={step}
              index={idx}
              totalSteps={totalSteps}
              activeStepIndex={activeStepIndex}
              onContinueStep={handleContinueStep}
            />
          ))}
        </section>

        {/* Complete Verification Bottom Action Box */}
        <section className="bottom-complete-box">
          <button 
            className={`complete-verification-btn ${isAllCompleted ? 'enabled' : 'disabled'}`}
            disabled={!isAllCompleted}
            onClick={handleCompleteVerification}
          >
            {isAllCompleted ? <CheckCircle2 size={20} /> : <Lock size={18} />}
            <span>Complete Verification</span>
            <ArrowRight size={18} />
          </button>

          <p className="bottom-helper-text">
            {isAllCompleted 
              ? 'All required steps completed! Click above to activate your account.' 
              : 'Complete all steps above to unlock the Complete Verification button.'}
          </p>

          {/* Quick Demo Assist Actions */}
          <div className="demo-actions-row">
            {!isAllCompleted ? (
              <>
                <button type="button" onClick={handleQuickAdvance} className="demo-link-btn">
                  [Demo: Pass Step {currentDisplayStep}]
                </button>
                <button type="button" onClick={handleQuickCompleteAll} className="demo-link-btn highlight">
                  [Demo: Pass All Steps]
                </button>
              </>
            ) : (
              <button type="button" onClick={handleResetDemo} className="demo-link-btn">
                [Reset Demo Workflow]
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
