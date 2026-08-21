import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, FileText, Camera, UserCheck, 
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import StepCard from '../components/StepCard';
import '../styles/verification-hub.css';

const INITIAL_STEPS = [
  {
    id: 'aadhaar',
    title: 'Aadhaar Verification',
    desc: 'Verify your Aadhaar using DigiLocker or OTP.',
    status: 'pending',
    icon: CreditCard,
    actionText: 'Start Verification'
  },
  {
    id: 'pan',
    title: 'PAN Verification',
    desc: 'Validate your PAN details with government records.',
    status: 'pending',
    icon: FileText,
    actionText: 'Verify PAN'
  },
  {
    id: 'selfie',
    title: 'Selfie Verification',
    desc: 'Capture a live selfie for face matching.',
    status: 'pending',
    icon: Camera,
    actionText: 'Capture Selfie'
  },
  {
    id: 'profile',
    title: 'Profile Review',
    desc: 'Review your submitted information before final submission.',
    status: 'pending',
    icon: UserCheck,
    actionText: 'Review Details'
  }
];

export default function VerificationHubPage() {
  const { aadhaarVerified, panVerified, selfieVerified, reviewReady } = useVerification();
  const navigate = useNavigate();

  const [steps, setSteps] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`kyc_steps_${user?.username}`);
      return saved ? JSON.parse(saved) : INITIAL_STEPS;
    } catch {
      return INITIAL_STEPS;
    }
  });

  useEffect(() => {
    setSteps(prev => prev.map(step => {
      if (step.id === 'aadhaar') {
        return aadhaarVerified
          ? { ...step, status: 'completed', actionText: 'Completed' }
          : { ...step, status: 'pending', actionText: 'Start Verification' };
      }
      if (step.id === 'pan') {
        return panVerified
          ? { ...step, status: 'completed', actionText: 'Completed' }
          : { ...step, status: 'pending', actionText: 'Verify PAN' };
      }
      if (step.id === 'selfie') {
        return selfieVerified
          ? { ...step, status: 'completed', actionText: 'Completed' }
          : { ...step, status: 'pending', actionText: 'Capture Selfie' };
      }
      if (step.id === 'profile') {
        return reviewReady
          ? { ...step, status: 'completed', actionText: 'Completed' }
          : { ...step, status: 'pending', actionText: 'Review Details' };
      }
      return step;
    }));
  }, [aadhaarVerified, panVerified, selfieVerified, reviewReady]);

  useEffect(() => {
    if (user?.username) {
      sessionStorage.setItem(`kyc_steps_${user.username}`, JSON.stringify(steps));
    }
  }, [steps, user]);

  const handleStepClick = (stepId) => {
    navigate('/verify/documents', { state: { stepId } });
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const isAllCompleted = completedCount === totalSteps;

  const handleCompleteRegistration = () => {
    if (isAllCompleted) {
      navigate('/dashboard');
    }
  };

  const handleQuickCompleteDemo = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'completed', actionText: 'Completed' })));
  };

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <div className="page-header-section">
            <h1 className="page-title">Verification Hub</h1>
            <p className="page-subtitle">
              Finish the steps below to activate your VerifyPay account, <strong>{user?.username}</strong>.
            </p>
          </div>

          <div className="fintech-card">
            <div className="progress-text-row">
              <span className="step-progress-label">Registration Progress</span>
              <span className="step-progress-percent">{completedCount} of {totalSteps} Completed ({progressPercent}%)</span>
            </div>
            <div className="progress-bar-bg" style={{ marginBottom: '24px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="steps-grid-container">
              {steps.map(step => (
                <StepCard 
                  key={step.id} 
                  step={step} 
                  onClick={handleStepClick} 
                />
              ))}
            </div>

            <div className="hub-security-banner">
              <ShieldCheck size={18} className="blue" />
              <span>256-bit SSL Encrypted & Bank-Grade Identity Security</span>
            </div>

            <div className="hub-action-section">
              <button 
                className={`primary-action-btn ${isAllCompleted ? 'enabled' : ''}`}
                disabled={!isAllCompleted}
                onClick={handleCompleteRegistration}
              >
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </button>

              {!isAllCompleted && (
                <button 
                  type="button"
                  onClick={handleQuickCompleteDemo}
                  className="demo-btn"
                  style={{ marginTop: '12px', display: 'block', margin: '12px auto 0 auto' }}
                >
                  [Demo Mode: Complete All Steps Instantly]
                </button>
              )}
            </div>
          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
