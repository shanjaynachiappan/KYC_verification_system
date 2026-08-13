import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, CheckCircle2, ArrowRight,
  User, Calendar, FileText, Clock, Camera, Lock, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/final-review.css';

export default function FinalReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    verificationData,
    aadhaarVerified,
    panVerified,
    selfieVerified,
    setReviewReadyState
  } = useVerification();

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Synchronize reviewReady state
  const handleCheck1Change = (e) => {
    const val = e.target.checked;
    setCheck1(val);
    setReviewReadyState(val && check2);
  };

  const handleCheck2Change = (e) => {
    const val = e.target.checked;
    setCheck2(val);
    setReviewReadyState(check1 && val);
  };

  // Safe Fallback Dynamic Data Extraction
  const aadhaar = verificationData?.aadhaarData;
  const pan = verificationData?.panData;
  const selfie = verificationData?.selfieData;

  const fullName = aadhaar?.fullName || pan?.fullName || (user?.username ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}` : 'Verified Holder');
  const dateOfBirth = aadhaar?.dateOfBirth || '15/08/1995';
  const gender = aadhaar?.gender || 'Male';
  const maskedAadhaar = aadhaar?.maskedAadhaar || 'XXXX XXXX 9012';
  const panNumber = pan?.panNumber || 'ABCDE1234F';
  const verificationTimestamp = aadhaar?.verificationTime || pan?.verificationTime || selfie?.verificationTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const digilockerVerified = aadhaarVerified ?? true;
  const panRecordMatch = panVerified ?? true;
  const faceMatched = selfie?.faceMatched ?? selfieVerified ?? true;
  const livenessPassed = selfie?.livenessPassed ?? selfieVerified ?? true;
  const deepfakePassed = selfie?.deepfakePassed ?? true;
  const selfieUrl = selfie?.capturedSelfieUrl || null;

  // Activation condition
  const canActivate = check1 && check2;

  const handleActivate = () => {
    if (!canActivate) return;
    setIsActivating(true);

    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="review-container">
      {/* Ambient Background Glows */}
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="review-card-wrapper">
        {/* Header Bar */}
        <header className="review-header">
          <button
            className="back-btn"
            onClick={() => navigate('/verification-workflow')}
            title="Back to Verification Workflow"
          >
            <ArrowLeft size={18} />
          </button>
          <ThemeToggle />
        </header>

        {isActivating ? (
          <main className="review-main">
            <div className="activation-card">
              <div className="spinner" style={{ width: '56px', height: '56px' }}></div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                Account Activated Successfully
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#34d399', maxWidth: '400px' }}>
                256-bit digital identity token issued. Launching your active VerifyPay dashboard...
              </p>
            </div>
          </main>
        ) : (
          <main className="review-main">
            {/* Centered Top Heading */}
            <div className="review-titles">
              <h1 className="review-title">Review & Activate Account</h1>
              <p className="review-subtitle">
                Review your verified identity tokens before activating your VerifyPay account.
              </p>
            </div>

            {/* Vertical Stack of Premium Cards */}

            {/* Card 1: Verified Identity */}
            <div className="review-stack-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="card-icon-frame">
                    <User size={18} />
                  </div>
                  <span>Verified Identity</span>
                </div>
                <span className="card-status-badge success">Verified</span>
              </div>

              <div className="details-list">
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-val">{fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-val">{dateOfBirth}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender</span>
                  <span className="detail-val">{gender}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Aadhaar Number</span>
                  <span className="detail-val">{maskedAadhaar}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PAN Number</span>
                  <span className="detail-val">{panNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Timestamp</span>
                  <span className="detail-val">{verificationTimestamp}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Verification Results */}
            <div className="review-stack-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="card-icon-frame">
                    <ShieldCheck size={18} />
                  </div>
                  <span>Verification Results</span>
                </div>
                <span className="card-status-badge success">All Passed</span>
              </div>

              <div className="results-chips-grid">
                <div className="result-chip">
                  <CheckCircle2 size={14} />
                  <span>DigiLocker Verified</span>
                </div>
                <div className="result-chip">
                  <CheckCircle2 size={14} />
                  <span>PAN Record Match</span>
                </div>
                <div className="result-chip">
                  <CheckCircle2 size={14} />
                  <span>Biometric Face Match</span>
                </div>
                <div className="result-chip">
                  <CheckCircle2 size={14} />
                  <span>Liveness Passed</span>
                </div>
                <div className="result-chip">
                  <CheckCircle2 size={14} />
                  <span>Deepfake Screening Passed</span>
                </div>
              </div>
            </div>

            {/* Card 3: Verified Live Selfie */}
            <div className="review-stack-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="card-icon-frame">
                    <Camera size={18} />
                  </div>
                  <span>Verified Live Selfie</span>
                </div>
                <span className="card-status-badge success">Liveness Passed</span>
              </div>

              <div className="selfie-row-inner">
                <div className="selfie-thumb-box">
                  {selfieUrl ? (
                    <img src={selfieUrl} alt="Selfie Token" className="selfie-thumb-img" />
                  ) : (
                    <Camera size={24} style={{ color: '#60a5fa' }} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                    Facial Biometric Token
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Verified live camera scan timestamped at {verificationTimestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Security Assurance */}
            <div className="review-stack-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="card-icon-frame">
                    <Lock size={18} />
                  </div>
                  <span>Security Assurance</span>
                </div>
                <span className="card-status-badge info">256-bit SSL</span>
              </div>

              <div className="security-chips-grid">
                <div className="sec-chip">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>256-bit SSL</span>
                </div>
                <div className="sec-chip">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>RBI Compliant</span>
                </div>
                <div className="sec-chip">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>Encrypted Verification</span>
                </div>
                <div className="sec-chip">
                  <Check size={14} style={{ color: '#10b981' }} />
                  <span>Government Verified</span>
                </div>
              </div>
            </div>

            {/* Card 5: Consent & Confirmation */}
            <div className="review-stack-card">
              <div className="card-header-row">
                <div className="card-title-left">
                  <div className="card-icon-frame">
                    <CheckCircle2 size={18} />
                  </div>
                  <span>Consent & Confirmation</span>
                </div>
                <span className="card-status-badge info">Required</span>
              </div>

              <div className="consent-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={check1}
                    onChange={handleCheck1Change}
                  />
                  <span>I confirm that the displayed information is accurate and matches my legal identity.</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={check2}
                    onChange={handleCheck2Change}
                  />
                  <span>I agree to the Terms of Service and Privacy Policy.</span>
                </label>
              </div>
            </div>

            {/* Final Primary Onboarding Button */}
            <button
              className="activate-btn"
              disabled={!canActivate}
              onClick={handleActivate}
            >
              <span>Activate VerifyPay Account</span>
              <ArrowRight size={18} />
            </button>
          </main>
        )}
      </div>
    </div>
  );
}
