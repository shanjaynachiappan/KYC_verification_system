import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import AadhaarVerificationPage from './AadhaarVerificationPage';
import PanVerificationPage from './PanVerificationPage';
import LiveSelfiePage from './LiveSelfiePage';
import FinalReviewPage from './FinalReviewPage';
import '../styles/auth.css';

export default function DocumentVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const stepId = location.state?.stepId || 'aadhaar';
  const stepIndex = location.state?.stepIndex !== undefined ? location.state.stepIndex : 0;

  // Delegate dedicated verification pages
  if (stepId === 'aadhaar') {
    return <AadhaarVerificationPage />;
  }

  if (stepId === 'pan') {
    return <PanVerificationPage />;
  }

  if (stepId === 'selfie') {
    return <LiveSelfiePage />;
  }

  if (stepId === 'profile') {
    return <FinalReviewPage />;
  }

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);

    if (user?.username) {
      try {
        const savedIndex = sessionStorage.getItem(`kyc_workflow_step_${user.username}`);
        const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
        if (stepIndex >= currentIndex) {
          sessionStorage.setItem(`kyc_workflow_step_${user.username}`, (stepIndex + 1).toString());
        }
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      navigate('/verification-workflow');
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="auth-card-wrapper" style={{ maxWidth: '520px' }}>
        <header className="auth-header">
          <button 
            className="back-btn" 
            onClick={() => navigate('/verification-workflow')}
            title="Back to Verification Workflow"
          >
            <ArrowLeft size={18} />
          </button>
          <ThemeToggle />
        </header>

        <main className="auth-main">
          <div className="auth-titles">
            <h1 className="auth-title">Identity Verification</h1>
            <p className="auth-subtitle">Provide required verification details.</p>
          </div>

          {isSuccess ? (
            <div className="error-banner" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '24px', flexDirection: 'column', gap: '12px' }}>
              <CheckCircle2 size={40} />
              <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>Step Verified Successfully!</strong>
              <p style={{ fontSize: '0.88rem', textAlign: 'center', color: '#cbd5e1' }}>Returning to your verification workflow timeline...</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleVerifySubmit}>
              <div className="form-group">
                <label className="input-label">Verification Reference / Details</label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Enter details to confirm"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>Confirm & Complete Step</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
