import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, FileText, Camera, UserCheck, 
  Lock, LogOut, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [steps, setSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(`kyc_steps_${user?.username}`);
      return saved ? JSON.parse(saved) : INITIAL_STEPS;
    } catch {
      return INITIAL_STEPS;
    }
  });

  useEffect(() => {
    if (user?.username) {
      localStorage.setItem(`kyc_steps_${user.username}`, JSON.stringify(steps));
    }
  }, [steps, user]);

  const handleStepClick = (stepId) => {
    navigate('/verify/documents', { state: { stepId } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

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
    <div className="verification-hub-container">
      {/* Glow Orbs */}
      <div className="bg-glow-orb glow-1"></div>
      <div className="bg-glow-orb glow-2"></div>

      {/* Top Bar Navigation */}
      <header className="hub-header">
        <Logo size="small" />
        
        <div className="header-right">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="username-text">{user?.username || 'Member'}</span>
          </div>

          <ThemeToggle />

          <button className="hub-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="hub-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="welcome-heading">Complete your verification</h1>
          <p className="welcome-subheading">
            Finish the steps below to activate your VerifyPay account and unlock all features, <strong>{user?.username}</strong>.
          </p>
        </section>

        {/* Overall Progress Card */}
        <section className="progress-card-container">
          <div className="progress-info">
            <span className="progress-tag">Verification Status</span>
            <h2 className="progress-title">Registration progress</h2>
            <p className="progress-subtitle">
              {completedCount} of {totalSteps} steps completed
            </p>
          </div>

          <div className="circular-progress-wrapper">
            <svg className="circular-progress-svg" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <circle className="circle-bg" cx="50" cy="50" r={radius} />
              <circle 
                className="circle-fill" 
                cx="50" 
                cy="50" 
                r={radius} 
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset
                }}
              />
            </svg>
            <span className="progress-percent-text">{progressPercent}%</span>
          </div>
        </section>

        {/* Verification Steps Section */}
        <section className="steps-section">
          <h2 className="steps-section-title">Required Steps</h2>
          <div className="steps-grid">
            {steps.map(step => (
              <StepCard 
                key={step.id} 
                step={step} 
                onClick={handleStepClick} 
              />
            ))}
          </div>
        </section>

        {/* Security Information Card */}
        <section className="security-card">
          <div className="security-card-header">
            <ShieldCheck size={20} />
            <span>Bank-Grade Identity Security</span>
          </div>

          <div className="security-items-grid">
            <div className="security-item">
              <CheckCircle2 size={16} className="security-item-icon" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <div className="security-item">
              <CheckCircle2 size={16} className="security-item-icon" />
              <span>RBI Compliant Flow</span>
            </div>
            <div className="security-item">
              <CheckCircle2 size={16} className="security-item-icon" />
              <span>Secure Biometric</span>
            </div>
            <div className="security-item">
              <CheckCircle2 size={16} className="security-item-icon" />
              <span>Real-time Liveness Check</span>
            </div>
          </div>
        </section>

        {/* Continue Section */}
        <section className="continue-section">
          <button 
            className={`complete-reg-btn ${isAllCompleted ? 'enabled' : 'disabled'}`}
            disabled={!isAllCompleted}
            onClick={handleCompleteRegistration}
          >
            <span>Complete Registration</span>
            <ArrowRight size={18} />
          </button>
          
          <p className="continue-helper-text">
            {isAllCompleted 
              ? 'All verification steps completed! Click above to enter your dashboard.'
              : 'Finish all required steps to continue.'}
          </p>

          {!isAllCompleted && (
            <button 
              type="button"
              onClick={handleQuickCompleteDemo}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '4px'
              }}
            >
              [Demo Mode: Complete All Steps Instantly]
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
