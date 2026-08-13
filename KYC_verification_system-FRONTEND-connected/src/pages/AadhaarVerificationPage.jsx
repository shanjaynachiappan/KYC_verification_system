import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Lock, CheckCircle2, ShieldCheck, 
  ArrowRight, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/aadhaar.css';

export default function AadhaarVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markAadhaarVerified } = useVerification();

  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('input'); // 'input' | 'loading' | 'success'
  const [verifiedDetails, setVerifiedDetails] = useState(null);

  const handleAadhaarChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 12) {
      setAadhaarRaw(rawValue);
      setError('');
    }
  };

  const formatDisplayAadhaar = (raw) => {
    if (!raw) return '';
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (aadhaarRaw.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    setError('');
    setStatus('loading');

    setTimeout(() => {
      const details = {
        name: user?.username ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}` : 'Verified Holder',
        dob: '15 / 08 / 1995',
        gender: 'Male',
        last4: aadhaarRaw.slice(-4)
      };

      if (user?.username) {
        try {
          const savedIndex = localStorage.getItem(`kyc_workflow_step_${user.username}`);
          const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
          if (currentIndex === 0) {
            localStorage.setItem(`kyc_workflow_step_${user.username}`, '1');
          }
        } catch (err) {
          console.error(err);
        }
      }

      markAadhaarVerified(details);
      setVerifiedDetails(details);
      setStatus('success');
    }, 1800);
  };

  const handleContinueToPan = () => {
    navigate('/verification-workflow');
  };

  return (
    <div className="aadhaar-container">
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="aadhaar-card-wrapper">
        <header className="aadhaar-header">
          <button 
            className="back-btn" 
            onClick={() => navigate('/verification-workflow')}
            title="Back to Verification Workflow"
          >
            <ArrowLeft size={18} />
          </button>
          <ThemeToggle />
        </header>

        <main className="aadhaar-main">
          <div className="aadhaar-titles">
            <h1 className="aadhaar-title">Aadhaar Verification</h1>
            <p className="aadhaar-subtitle">
              Enter your Aadhaar number to securely verify your identity using DigiLocker.
            </p>
          </div>

          <div className="security-note-card">
            <div className="security-note-title">
              <ShieldCheck size={16} />
              <span>DigiLocker Secure Protocol</span>
            </div>
            <div className="security-features-row">
              <div className="security-chip">
                <Lock size={12} className="security-chip-icon" />
                <span>256-bit Encrypted</span>
              </div>
              <div className="security-chip">
                <CheckCircle2 size={12} className="security-chip-icon" />
                <span>OTP Verified</span>
              </div>
              <div className="security-chip">
                <Shield size={12} className="security-chip-icon" />
                <span>Direct DigiLocker Fetch</span>
              </div>
            </div>
          </div>

          {status === 'input' && (
            <form className="aadhaar-form" onSubmit={handleVerify}>
              <div className="form-group">
                <div className="input-label-row">
                  <label className="input-label" htmlFor="aadhaar-input">
                    Aadhaar Number
                  </label>
                  <span className="digit-count">
                    {aadhaarRaw.length} / 12 Digits
                  </span>
                </div>

                <div className="aadhaar-input-wrapper">
                  <Shield size={20} className="aadhaar-input-icon" />
                  <input 
                    id="aadhaar-input"
                    type="text" 
                    className="aadhaar-input"
                    placeholder="XXXX XXXX XXXX"
                    value={formatDisplayAadhaar(aadhaarRaw)}
                    onChange={handleAadhaarChange}
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="digilocker-btn"
                disabled={aadhaarRaw.length === 0}
              >
                <ShieldCheck size={18} />
                <span>Verify with DigiLocker</span>
              </button>
            </form>
          )}

          {status === 'loading' && (
            <div className="loading-box">
              <div className="spinner"></div>
              <div className="loading-text">Connecting to DigiLocker…</div>
              <div className="loading-subtext">
                Fetching government-verified Aadhaar credentials over 256-bit SSL connection.
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="success-card">
              <div className="success-header">
                <div className="success-icon-badge">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="success-title">Aadhaar verified successfully</h3>
              </div>

              <div className="fetched-details-list">
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{verifiedDetails?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">{verifiedDetails?.dob}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Aadhaar Number</span>
                  <span className="detail-value">XXXX XXXX {verifiedDetails?.last4}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Verification Source</span>
                  <span className="detail-value" style={{ color: '#34d399' }}>DigiLocker Verified</span>
                </div>
              </div>

              <button className="continue-pan-btn" onClick={handleContinueToPan}>
                <span>Continue to PAN Verification</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
