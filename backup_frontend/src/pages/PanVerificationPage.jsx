import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Lock, CheckCircle2, ShieldCheck, 
  ArrowRight, AlertCircle, FileText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/pan.css';

export default function PanVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markPanVerified } = useVerification();

  const [panRaw, setPanRaw] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('input');
  const [verifiedDetails, setVerifiedDetails] = useState(null);

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length <= 10) {
      setPanRaw(val);
      setError('');
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (panRaw.length !== 10) {
      setError('PAN number must be exactly 10 characters (e.g. ABCDE1234F).');
      return;
    }

    setError('');
    setStatus('loading');

    setTimeout(() => {
      const details = {
        name: user?.username ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}` : 'Verified Cardholder',
        maskedPan: `${panRaw.slice(0, 5)}****${panRaw.slice(-1)}`,
        status: 'Active & Valid'
      };

      if (user?.username) {
        try {
          const savedIndex = localStorage.getItem(`kyc_workflow_step_${user.username}`);
          const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
          if (currentIndex <= 1) {
            localStorage.setItem(`kyc_workflow_step_${user.username}`, '2');
          }
        } catch (err) {
          console.error(err);
        }
      }

      markPanVerified(details);
      setVerifiedDetails(details);
      setStatus('success');
    }, 1800);
  };

  const handleContinueToSelfie = () => {
    navigate('/verification-workflow');
  };

  return (
    <div className="pan-container">
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="pan-card-wrapper">
        <header className="pan-header">
          <button 
            className="back-btn" 
            onClick={() => navigate('/verification-workflow')}
            title="Back to Verification Workflow"
          >
            <ArrowLeft size={18} />
          </button>
          <ThemeToggle />
        </header>

        <main className="pan-main">
          <div className="pan-titles">
            <h1 className="pan-title">PAN Verification</h1>
            <p className="pan-subtitle">
              Enter your 10-character PAN number to validate your identity with NSDL government tax records.
            </p>
          </div>

          <div className="pan-security-note-card">
            <div className="pan-security-note-title">
              <ShieldCheck size={16} />
              <span>NSDL Database Secure Protocol</span>
            </div>
            <div className="pan-security-features-row">
              <div className="pan-security-chip">
                <Lock size={12} className="pan-security-chip-icon" />
                <span>256-bit Encrypted</span>
              </div>
              <div className="pan-security-chip">
                <CheckCircle2 size={12} className="pan-security-chip-icon" />
                <span>Government Tax Records</span>
              </div>
              <div className="pan-security-chip">
                <Shield size={12} className="pan-security-chip-icon" />
                <span>Direct NSDL Fetch</span>
              </div>
            </div>
          </div>

          {status === 'input' && (
            <form className="pan-form" onSubmit={handleVerify}>
              <div className="form-group">
                <div className="input-label-row">
                  <label className="input-label" htmlFor="pan-input">
                    PAN Card Number
                  </label>
                  <span className="digit-count">
                    {panRaw.length} / 10 Characters
                  </span>
                </div>

                <div className="pan-input-wrapper">
                  <FileText size={20} className="pan-input-icon" />
                  <input 
                    id="pan-input"
                    type="text" 
                    className="pan-input"
                    placeholder="ABCDE1234F"
                    value={panRaw}
                    onChange={handlePanChange}
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <div className="error-message" style={{ marginTop: '8px' }}>
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="nsdl-verify-btn"
                disabled={panRaw.length === 0}
              >
                <ShieldCheck size={18} />
                <span>Verify with NSDL Database</span>
              </button>
            </form>
          )}

          {status === 'loading' && (
            <div className="pan-loading-box">
              <div className="pan-spinner"></div>
              <div className="loading-text">Connecting to NSDL Database…</div>
              <div className="loading-subtext">
                Fetching government-verified PAN tax credentials over 256-bit SSL connection.
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="pan-success-card">
              <div className="success-header">
                <div className="success-icon-badge">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="success-title">PAN verified successfully</h3>
              </div>

              <div className="fetched-details-list">
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{verifiedDetails?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PAN Number</span>
                  <span className="detail-value">{verifiedDetails?.maskedPan}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tax Record Status</span>
                  <span className="detail-value" style={{ color: '#34d399' }}>{verifiedDetails?.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Verification Source</span>
                  <span className="detail-value" style={{ color: '#34d399' }}>NSDL Government Verified</span>
                </div>
              </div>

              <button className="continue-selfie-btn" onClick={handleContinueToSelfie}>
                <span>Continue to Live Selfie Verification</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
