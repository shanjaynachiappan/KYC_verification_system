import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, CheckCircle2, ShieldCheck, 
  ArrowRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import { createUser, initDigilocker, getDigilockerStatus, fetchAadhaar } from '../services/api';
import '../styles/aadhaar.css';

export default function AadhaarVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userId, 
    setUserId, 
    digilockerRequestId, 
    setDigilockerRequestId, 
    aadhaarVerified, 
    aadhaarData, 
    markAadhaarVerified 
  } = useVerification();

  const [aadhaarRaw, setAadhaarRaw] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(aadhaarVerified ? 'success' : 'input'); // 'input' | 'loading' | 'polling' | 'success'
  const [loadingTitle, setLoadingTitle] = useState('Starting verification...');
  const [loadingDesc, setLoadingDesc] = useState('Connecting to DigiLocker via secure government API portal.');
  const pollingTimerRef = useRef(null);

  // Sync state if already verified
  useEffect(() => {
    if (aadhaarVerified) {
      setStatus('success');
    }
  }, [aadhaarVerified]);

  // Handle DigiLocker callback & polling on mount if request_id exists and not yet verified
  useEffect(() => {
    if (digilockerRequestId && !aadhaarVerified) {
      startPollingStatus(digilockerRequestId);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [digilockerRequestId, aadhaarVerified]);

  const startPollingStatus = (requestId) => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    setStatus('polling');
    setLoadingTitle('Waiting for DigiLocker consent...');
    setLoadingDesc('Checking status of your DigiLocker authentication...');

    let attempts = 0;
    const maxAttempts = 60; // Poll for max 2.5 minutes (every 2.5s)

    const poll = async () => {
      attempts += 1;
      try {
        const res = await getDigilockerStatus(requestId);
        const consentStatus = res.consent_status ? res.consent_status.toLowerCase() : '';

        if (consentStatus === 'authenticated') {
          clearInterval(pollingTimerRef.current);
          handleFetchAadhaar(requestId);
        } else if (consentStatus === 'denied') {
          clearInterval(pollingTimerRef.current);
          setStatus('input');
          setError('DigiLocker authentication failed. Consent was denied.');
        } else if (consentStatus === 'failed' || consentStatus === 'error') {
          clearInterval(pollingTimerRef.current);
          setStatus('input');
          setError('DigiLocker authentication failed. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollingTimerRef.current);
          setStatus('input');
          setError('Verification timed out waiting for DigiLocker consent. Please try again.');
        }
      } catch (err) {
        console.error('Error polling DigiLocker status:', err);
        if (attempts >= maxAttempts) {
          clearInterval(pollingTimerRef.current);
          setStatus('input');
          setError('Unable to verify DigiLocker status. Please try again.');
        }
      }
    };

    poll();
    pollingTimerRef.current = setInterval(poll, 2500);
  };

  const handleFetchAadhaar = async (requestId) => {
    try {
      setStatus('loading');
      setLoadingTitle('Fetching Aadhaar details...');
      setLoadingDesc('Retrieving government-verified Aadhaar credentials over 256-bit SSL connection.');

      const data = await fetchAadhaar(requestId);

      // Save to context
      markAadhaarVerified(data);

      // Unlock step 1 in workflow storage for current user
      if (user?.username) {
        try {
          const savedIndex = sessionStorage.getItem(`kyc_workflow_step_${user.username}`);
          const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
          if (currentIndex === 0) {
            sessionStorage.setItem(`kyc_workflow_step_${user.username}`, '1');
          }
        } catch (err) {
          console.error('Error updating workflow step index:', err);
        }
      }

      setStatus('success');
    } catch (err) {
      console.error('Error fetching Aadhaar details:', err);
      setStatus('input');
      setError('Unable to fetch Aadhaar details. Please try again.');
    }
  };

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

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    setLoadingTitle('Starting verification...');
    setLoadingDesc('Creating secure verification session...');

    try {
      // Step 1: Create user if not already present
      let activeUserId = userId;
      if (!activeUserId) {
        const userRes = await createUser();
        activeUserId = userRes.user_id;
        setUserId(activeUserId);
      }

      // Step 2: Initialize DigiLocker with user_id
      setLoadingTitle('Connecting to DigiLocker...');
      setLoadingDesc('Generating secure DigiLocker consent link...');

      const initRes = await initDigilocker(activeUserId);

      if (!initRes.request_id || !initRes.redirect_url) {
        throw new Error('Invalid response from DigiLocker init API');
      }

      const reqId = initRes.request_id;
      const redirectUrl = initRes.redirect_url;

      // Store request_id in context & local storage
      setDigilockerRequestId(reqId);

      // Step 3: Redirect to backend DigiLocker URL
      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error initiating DigiLocker verification:', err);
      setStatus('input');
      setError('DigiLocker authentication failed. Unable to initialize verification.');
    }
  };

  const handleRestartVerification = () => {
    setDigilockerRequestId(null);
    setStatus('input');
    setError('');
  };

  const handleContinueToPan = () => {
    navigate('/verification-workflow');
  };

  const displayData = aadhaarData || {};

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <KycStepper activeStepIndex={aadhaarVerified ? 1 : 0} />

          <div className="page-header-section">
            <button 
              className="fintech-back-btn" 
              onClick={() => navigate('/verification-workflow')}
            >
              <ArrowLeft size={16} />
              <span>Back to Workflow</span>
            </button>
            <h1 className="page-title">Aadhaar Verification</h1>
            <p className="page-subtitle">
              {aadhaarVerified 
                ? 'Your Aadhaar details have been verified successfully.'
                : 'Verify your identity securely with government-backed DigiLocker integration.'}
            </p>
          </div>

          <div className="fintech-card">
            <div className="security-notice-banner">
              <div className="notice-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="notice-text">
                <strong>DigiLocker Secure Protocol</strong>
                <p>256-bit SSL encrypted connection over government API</p>
              </div>
            </div>

            {status === 'input' && (
              <form className="fintech-form" onSubmit={handleVerify}>
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="aadhaar-input">Aadhaar Number (Optional)</label>
                    <span className="digit-counter">{aadhaarRaw.length} / 12 Digits</span>
                  </div>

                  <div className="input-with-icon">
                    <Shield size={18} className="field-icon" />
                    <input 
                      id="aadhaar-input"
                      type="text" 
                      className="fintech-input"
                      placeholder="XXXX XXXX XXXX"
                      value={formatDisplayAadhaar(aadhaarRaw)}
                      onChange={handleAadhaarChange}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="fintech-error-msg">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="primary-action-btn"
                >
                  <ShieldCheck size={18} />
                  <span>Verify with DigiLocker</span>
                </button>

                {error && (
                  <button 
                    type="button" 
                    className="primary-action-btn"
                    style={{ marginTop: '12px', backgroundColor: '#4b5563', borderColor: '#4b5563' }}
                    onClick={handleContinueToPan}
                  >
                    <span>Skip DigiLocker & Continue</span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </form>
            )}

            {(status === 'loading' || status === 'polling') && (
              <div className="fintech-loading-box">
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">{loadingTitle}</h3>
                <p className="loading-desc">{loadingDesc}</p>
                
                {status === 'polling' && (
                  <button 
                    type="button" 
                    className="fintech-back-btn" 
                    style={{ marginTop: '16px' }}
                    onClick={handleRestartVerification}
                  >
                    <RefreshCw size={14} />
                    <span>Restart Verification</span>
                  </button>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="fintech-success-view">
                <div className="success-banner-header">
                  <div className="success-check-badge">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3>Aadhaar verified successfully</h3>
                </div>

                <div className="details-table">
                  <div className="table-row">
                    <span className="row-label">Full Name</span>
                    <span className="row-val">{displayData.name || displayData.fullName || user?.username || 'Verified Holder'}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">Date of Birth</span>
                    <span className="row-val">{displayData.dob || displayData.dateOfBirth || 'Verified'}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">Aadhaar Number</span>
                    <span className="row-val">{displayData.id_number_masked || displayData.maskedAadhaar || 'XXXX XXXX Verified'}</span>
                  </div>
                  {displayData.address && (
                    <div className="table-row">
                      <span className="row-label">Address</span>
                      <span className="row-val">{displayData.address}</span>
                    </div>
                  )}
                  <div className="table-row">
                    <span className="row-label">Verification Source</span>
                    <span className="row-val green-text">DigiLocker Verified</span>
                  </div>
                </div>

                <button className="primary-action-btn" onClick={handleContinueToPan}>
                  <span>Continue to Next Verification Step</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
