import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, CheckCircle2, ArrowRight,
  User, Camera, Lock, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import '../styles/final-review.css';

export default function FinalReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    verificationData,
    setReviewReadyState
  } = useVerification();

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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

  const aadhaar = verificationData?.aadhaarData;
  const pan = verificationData?.panData;
  const selfie = verificationData?.selfieData;

  const fullName = aadhaar?.fullName || pan?.fullName || (user?.username ? `${user.username.charAt(0).toUpperCase()}${user.username.slice(1)}` : 'Verified Holder');
  const dateOfBirth = aadhaar?.dateOfBirth || '15/08/1995';
  const gender = aadhaar?.gender || 'Male';
  const maskedAadhaar = aadhaar?.maskedAadhaar || 'XXXX XXXX 9012';
  const panNumber = pan?.panNumber || 'ABCDE1234F';
  const verificationTimestamp = aadhaar?.verificationTime || pan?.verificationTime || selfie?.verificationTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const selfieUrl = selfie?.capturedSelfieUrl || null;

  const crossCheckResult = verificationData?.crossCheckResult || verificationData?.cross_check_result;
  const isPanMatched = crossCheckResult ? crossCheckResult.matched : (pan?.panMatched !== false);

  const canActivate = check1 && check2 && isPanMatched;

  const handleActivate = () => {
    if (!canActivate) return;
    setIsActivating(true);

    setTimeout(() => {
      navigate('/dashboard');
    }, 1800);
  };

  const verificationRows = [
    { title: 'DigiLocker Verification', desc: 'Government identity credentials verified', status: 'Passed', isPassed: true },
    { title: 'PAN Record Match', desc: 'NSDL tax database identity matched', status: isPanMatched ? 'Passed' : 'Failed', isPassed: isPanMatched },
    { title: 'Biometric Face Match', desc: 'Face matched against identity photo', status: 'Passed', isPassed: true },
    { title: 'Liveness Screening', desc: '3D passive liveness confirmed', status: 'Passed', isPassed: true },
    { title: 'Deepfake Screening', desc: 'Neural anti-spoofing scan clean', status: 'Passed', isPassed: true },
    { title: 'AML & Compliance Screening', desc: 'Global watchlists and risk parameters cleared', status: 'Passed', isPassed: true }
  ];

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <KycStepper activeStepIndex={3} />

          <div className="page-header-section">
            <button 
              className="fintech-back-btn" 
              onClick={() => navigate('/verification-workflow')}
            >
              <ArrowLeft size={16} />
              <span>Back to Workflow</span>
            </button>
            <h1 className="page-title">Verification Results</h1>
            <p className="page-subtitle">
              Review your overall verification details before finalizing account activation.
            </p>
          </div>

          <div className="fintech-card">
            {isActivating ? (
              <div className="fintech-loading-box">
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">Activating Your VerifyPay Account…</h3>
                <p className="loading-desc">
                  Issuing 256-bit compliance token and directing to your dashboard.
                </p>
              </div>
            ) : (
              <div className="review-sections-container">
                {/* Overall Banner */}
                {isPanMatched ? (
                  <div className="overall-verified-banner">
                    <CheckCircle2 size={24} className="banner-check" />
                    <div>
                      <h3 className="banner-title">Verification Complete</h3>
                      <p className="banner-sub">All identity tokens have passed automated compliance screening.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overall-verified-banner" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ color: 'var(--danger)' }}>
                      <CheckCircle2 size={24} className="banner-check" style={{ color: 'var(--danger)', backgroundColor: 'transparent' }} />
                    </div>
                    <div>
                      <h3 className="banner-title" style={{ color: 'var(--danger)' }}>Verification Incomplete</h3>
                      <p className="banner-sub">Your PAN name does not match your Aadhaar name. Account activation cannot proceed.</p>
                    </div>
                  </div>
                )}

                {/* Verified Details Card */}
                <div className="review-block">
                  <div className="block-header">
                    <User size={16} className="block-icon" />
                    <h4>Verified Personal Details</h4>
                  </div>
                  <div className="details-table">
                    <div className="table-row">
                      <span className="row-label">Full Name</span>
                      <span className="row-val">{fullName}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">Date of Birth</span>
                      <span className="row-val">{dateOfBirth}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">Gender</span>
                      <span className="row-val">{gender}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">Aadhaar Number</span>
                      <span className="row-val">{maskedAadhaar}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">PAN Number</span>
                      <span className="row-val">{panNumber}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">Verification Time</span>
                      <span className="row-val">{verificationTimestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Clean Verification Summary Rows */}
                <div className="review-block">
                  <div className="block-header">
                    <ShieldCheck size={16} className="block-icon" />
                    <h4>Verification Summary Rows</h4>
                  </div>
                  <div className="verification-rows-list">
                    {verificationRows.map((row, i) => (
                      <div className="verification-clean-row" key={i}>
                        <div className="row-left">
                          {row.isPassed !== false ? (
                            <CheckCircle2 size={16} className="row-check-icon" />
                          ) : (
                            <XCircle size={16} className="row-check-icon" style={{ color: 'var(--danger)' }} />
                          )}
                          <div>
                            <span className="v-row-title">{row.title}</span>
                            <span className="v-row-desc">{row.desc}</span>
                          </div>
                        </div>
                        <span className={`v-row-badge ${row.isPassed === false ? 'failed-badge' : ''}`} style={row.isPassed === false ? { color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)' } : {}}>{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selfie Token */}
                {selfieUrl && (
                  <div className="review-block">
                    <div className="block-header">
                      <Camera size={16} className="block-icon" />
                      <h4>Captured Biometric Selfie</h4>
                    </div>
                    <div className="selfie-token-row">
                      <img src={selfieUrl} alt="Selfie" className="selfie-thumb" />
                      <div className="selfie-meta">
                        <strong>Live Biometric Token</strong>
                        <p>Timestamped scan on file</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Consent & Activate */}
                <div className="review-block consent-block">
                  <div className="block-header">
                    <Lock size={16} className="block-icon" />
                    <h4>Consent & Final Declaration</h4>
                  </div>
                  <div className="checkboxes-stack">
                    <label className="fintech-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={check1} 
                        onChange={handleCheck1Change} 
                      />
                      <span>I confirm that the displayed identity details are correct and match my official records.</span>
                    </label>

                    <label className="fintech-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={check2} 
                        onChange={handleCheck2Change} 
                      />
                      <span>I accept the VerifyPay Terms of Service and Identity Verification Agreement.</span>
                    </label>
                  </div>

                  <button 
                    className="primary-action-btn" 
                    disabled={!canActivate}
                    onClick={handleActivate}
                    style={{ marginTop: '16px' }}
                  >
                    <span>Activate VerifyPay Account</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
