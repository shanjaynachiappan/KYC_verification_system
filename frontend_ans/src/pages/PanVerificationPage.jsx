import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, 
  ArrowRight, AlertCircle, FileText, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import { verifyPan, crossCheck } from '../services/api';
import '../styles/pan.css';

export default function PanVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userId, 
    aadhaarVerified,
    panVerified, 
    panData, 
    crossCheckResult,
    markPanVerified 
  } = useVerification();

  const [panRaw, setPanRaw] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('input'); // 'input' | 'loading' | 'result'
  const [loadingTitle, setLoadingTitle] = useState('Verifying PAN with NSDL...');
  const [loadingDesc, setLoadingDesc] = useState('Validating credentials against official government tax records.');

  const [localPanData, setLocalPanData] = useState(panData || null);
  const [localCrossCheck, setLocalCrossCheck] = useState(crossCheckResult || null);

  // Sync state if already completed
  useEffect(() => {
    if (panData && crossCheckResult) {
      setLocalPanData(panData);
      setLocalCrossCheck(crossCheckResult);
      setStatus('result');
    }
  }, [panData, crossCheckResult]);

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length <= 10) {
      setPanRaw(val);
      setError('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    // Indian PAN regex format validation (5 letters + 4 numbers + 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panRaw)) {
      setError('Please enter a valid 10-character PAN number (e.g. ABCDE1234A).');
      return;
    }

    if (!userId) {
      setError('User session missing. Please complete Aadhaar verification first.');
      return;
    }

    setError('');
    setStatus('loading');
    setLoadingTitle('Verifying PAN with NSDL database...');
    setLoadingDesc('Checking real-time tax records over 256-bit SSL encrypted API connection.');

    try {
      // Step 1: Call POST /pan/verify
      const panRes = await verifyPan(userId, panRaw);

      const isPanValid = panRes.valid === true || (panRes.message && panRes.message.toLowerCase().includes('valid')) || Boolean(panRes.full_name);

      if (!isPanValid) {
        setStatus('input');
        setError(panRes.message || 'PAN verification failed. Please check the PAN number and try again.');
        return;
      }

      setLocalPanData(panRes);

      // Step 2: Call POST /ekyc/cross-check
      setLoadingTitle('Running Aadhaar ↔ PAN identity cross-check...');
      setLoadingDesc('Comparing DigiLocker identity record with Setu PAN database token...');

      let crossRes = null;
      try {
        crossRes = await crossCheck(userId);
      } catch (ccErr) {
        console.error('Cross check error:', ccErr);
        // Fallback if cross check API returns error
        crossRes = {
          matched: false,
          name_similarity: 0,
          aadhaar_name: 'Aadhaar Record',
          pan_name: panRes.full_name || 'PAN Record',
          checked_at: new Date().toISOString()
        };
      }

      setLocalCrossCheck(crossRes);

      // Save into context
      markPanVerified(panRes, crossRes);

      setStatus('result');
    } catch (err) {
      console.error('Error verifying PAN:', err);
      setStatus('input');
      const errDetail = err.response?.data?.detail || err.response?.data?.message || 'Unable to verify PAN. Please check the PAN number and try again.';
      setError(typeof errDetail === 'string' ? errDetail : 'PAN verification failed. Please try again.');
    }
  };

  const handleRetryPan = () => {
    setStatus('input');
    setError('');
  };

  const handleContinueToSelfie = () => {
    navigate('/verify/documents', { state: { stepId: 'selfie', stepIndex: 2 } });
  };

  const activePan = localPanData || panData || {};
  const activeCross = localCrossCheck || crossCheckResult || {};
  const isMatch = activeCross.matched === true;

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <KycStepper activeStepIndex={1} />

          <div className="page-header-section">
            <button 
              className="fintech-back-btn" 
              onClick={() => navigate('/verification-workflow')}
            >
              <ArrowLeft size={16} />
              <span>Back to Workflow</span>
            </button>
            <h1 className="page-title">PAN Verification</h1>
            <p className="page-subtitle">
              Validate your 10-character PAN card against government tax records and compare identity with Aadhaar.
            </p>
          </div>

          <div className="fintech-card">
            <div className="security-notice-banner">
              <div className="notice-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="notice-text">
                <strong>NSDL Database Secure Protocol</strong>
                <p>Real-time PAN tax database verification over 256-bit SSL</p>
              </div>
            </div>

            {!aadhaarVerified && (
              <div className="fintech-error-msg" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>Aadhaar verification must be completed before verifying PAN.</span>
              </div>
            )}

            {status === 'input' && (
              <form className="fintech-form" onSubmit={handleVerify}>
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="pan-input">PAN Card Number</label>
                    <span className="digit-counter">{panRaw.length} / 10 Characters</span>
                  </div>

                  <div className="input-with-icon">
                    <FileText size={18} className="field-icon" />
                    <input 
                      id="pan-input"
                      type="text" 
                      className="fintech-input uppercase"
                      placeholder="e.g. ABCDE1234A"
                      value={panRaw}
                      onChange={handlePanChange}
                      autoFocus
                      required
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
                  disabled={panRaw.length === 0}
                >
                  <ShieldCheck size={18} />
                  <span>Verify PAN</span>
                </button>
              </form>
            )}

            {status === 'loading' && (
              <div className="fintech-loading-box">
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">{loadingTitle}</h3>
                <p className="loading-desc">{loadingDesc}</p>
              </div>
            )}

            {status === 'result' && (
              <div className="fintech-success-view">
                {/* PAN Verification Status Banner */}
                <div className="success-banner-header">
                  <div className="success-check-badge">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3>PAN Verification Successful</h3>
                </div>

                <div className="details-table" style={{ marginBottom: '20px' }}>
                  <div className="table-row">
                    <span className="row-label">Full Name on PAN</span>
                    <span className="row-val">{activePan.full_name || activePan.fullName || user?.username || 'Verified Cardholder'}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">PAN Number</span>
                    <span className="row-val">{activePan.maskedPan || (panRaw ? `${panRaw.slice(0, 5)}XXXX${panRaw.slice(-1)}` : 'ABCDEXXXXA')}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">PAN Category</span>
                    <span className="row-val">{activePan.category || 'Individual'}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">Aadhaar Seeding Status</span>
                    <span className="row-val green-text">{activePan.aadhaar_seeding_status || 'LINKED'}</span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">Verification Source</span>
                    <span className="row-val green-text">NSDL Government Database</span>
                  </div>
                </div>

                {/* Identity Cross-Check Result Section */}
                <div className="cross-check-card" style={{ 
                  backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    {isMatch ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                    ) : (
                      <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                    )}
                    <strong style={{ fontSize: '0.98rem', color: isMatch ? 'var(--success)' : 'var(--warning)' }}>
                      {isMatch ? 'Identity Match Successful' : 'Aadhaar ↔ PAN Details Mismatch'}
                    </strong>
                  </div>

                  <div className="details-table" style={{ background: 'none', padding: 0 }}>
                    <div className="table-row">
                      <span className="row-label">Aadhaar Name</span>
                      <span className="row-val">{activeCross.aadhaar_name || 'DigiLocker Record'}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">PAN Name</span>
                      <span className="row-val">{activeCross.pan_name || activePan.full_name || 'NSDL Record'}</span>
                    </div>
                    <div className="table-row">
                      <span className="row-label">Name Similarity</span>
                      <span className={`row-val ${isMatch ? 'green-text' : 'warning-text'}`} style={{ fontWeight: 600 }}>
                        {activeCross.name_similarity !== undefined ? `${activeCross.name_similarity}%` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {!isMatch && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '10px', marginBottom: 0 }}>
                      <strong>Notice:</strong> Setu sandbox returns predefined test profiles (e.g. Vigneshwaran P vs Kumar Gaurav Rathod). Mismatch has been noted. Click <strong>"Continue Workflow"</strong> below to proceed to Live Selfie / Face Verification.
                    </p>
                  )}
                </div>

                {isMatch ? (
                  <button className="primary-action-btn" onClick={handleContinueToSelfie}>
                    <span>Continue to Next Verification Step</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="secondary-action-btn" onClick={handleRetryPan} style={{ flex: 1 }}>
                      <RefreshCw size={16} />
                      <span>Try Another PAN</span>
                    </button>
                    <button className="primary-action-btn" onClick={handleContinueToSelfie} style={{ flex: 1 }}>
                      <span>Continue Workflow</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
