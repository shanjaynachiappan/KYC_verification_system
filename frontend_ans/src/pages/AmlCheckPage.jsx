import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle,
  ArrowRight, RefreshCw, Landmark, Newspaper, Users, Wallet
} from 'lucide-react';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import { runAmlCheck } from '../services/api';
import '../styles/aml-check.css';

// Cycled while the backend call is in flight, purely cosmetic so the
// single screen doesn't feel frozen during the ~1-2s round trip.
const CHECK_STEPS = [
  { icon: ShieldCheck, text: 'Screening against global sanctions lists...' },
  { icon: Users, text: 'Checking Politically Exposed Person (PEP) databases...' },
  { icon: Newspaper, text: 'Scanning adverse media & negative news sources...' },
  { icon: Wallet, text: 'Assessing source of funds risk profile...' },
];

export default function AmlCheckPage() {
  const navigate = useNavigate();
  const { userId, aadhaarData, markAmlChecked, amlChecked, amlResult } = useVerification();

  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'flagged' | 'error'
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const cycleRef = useRef(null);

  const runCheck = async () => {
    setStatus('checking');
    setErrorMessage('');
    setStepIndex(0);

    cycleRef.current = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % CHECK_STEPS.length);
    }, 900);

    const nameToScreen = aadhaarData?.fullName || aadhaarData?.name;

    if (!userId || !nameToScreen) {
      clearInterval(cycleRef.current);
      setErrorMessage('Missing verified identity details. Please complete Aadhaar verification first.');
      setStatus('error');
      return;
    }

    try {
      const data = await runAmlCheck(userId, nameToScreen);
      clearInterval(cycleRef.current);
      setResult(data);
      markAmlChecked(data);

      const isFlagged = data.sanctions?.matched || data.pep?.matched ||
        data.adverse_media?.flagged || data.source_of_funds?.risk_level === 'high';

      setStatus(isFlagged ? 'flagged' : 'success');
    } catch (err) {
      clearInterval(cycleRef.current);
      console.error('AML screening error:', err);
      const detailMsg = err.response?.data?.detail || err.response?.data?.message;
      setErrorMessage(typeof detailMsg === 'string' ? detailMsg : 'AML/compliance screening failed. Please try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    // If this screen is revisited after already completing the check once,
    // just show the stored result instead of re-running it.
    if (amlChecked && amlResult) {
      setResult(amlResult);
      const isFlagged = amlResult.sanctions?.matched || amlResult.pep?.matched ||
        amlResult.adverse_media?.flagged || amlResult.source_of_funds?.risk_level === 'high';
      setStatus(isFlagged ? 'flagged' : 'success');
      return;
    }
    runCheck();
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    navigate('/verify/review');
  };

  const CurrentIcon = CHECK_STEPS[stepIndex].icon;

  return (
    <div className="fintech-layout aml-layout">
      <Header />

      <div className="aml-check-shell">
        <div className="aml-check-card">
          {status === 'checking' && (
            <div className="aml-checking-box">
              <div className="fintech-spinner"></div>
              <h2 className="aml-title">Running Compliance & AML Checks...</h2>
              <div className="aml-step-line">
                <CurrentIcon size={18} className="aml-step-icon" />
                <span>{CHECK_STEPS[stepIndex].text}</span>
              </div>
              <p className="aml-subtext">This usually takes just a few seconds.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="aml-error-box">
              <div className="aml-icon-wrapper danger">
                <AlertTriangle size={28} />
              </div>
              <h2 className="aml-title">Compliance Check Failed</h2>
              <p className="aml-subtext">{errorMessage}</p>
              <button className="primary-action-btn" onClick={runCheck}>
                <RefreshCw size={16} />
                <span>Retry Check</span>
              </button>
            </div>
          )}

          {(status === 'success' || status === 'flagged') && result && (
            <div className="aml-result-view">
              <div className={`aml-banner ${status === 'success' ? 'clear' : 'flagged'}`}>
                {status === 'success' ? <CheckCircle2 size={26} /> : <ShieldAlert size={26} />}
                <div>
                  <h2 className="aml-title">
                    {status === 'success' ? 'No Compliance Issues Found' : 'Flagged for Manual Review'}
                  </h2>
                  <p className="aml-subtext">
                    {status === 'success'
                      ? 'Sanctions, PEP, adverse media, and source-of-funds checks all came back clear.'
                      : 'One or more checks need a compliance officer to review before final approval. You can still continue -- your application will be marked pending.'}
                  </p>
                </div>
              </div>

              <div className="aml-check-grid">
                <div className={`aml-check-tile ${result.sanctions?.matched ? 'hit' : 'clear'}`}>
                  <div className="aml-tile-header">
                    <Landmark size={16} />
                    <span>Sanctions List</span>
                  </div>
                  <p className="aml-tile-status">
                    {result.sanctions?.matched ? 'Potential match found' : 'No matches'}
                  </p>
                  {result.sanctions?.matches?.[0] && (
                    <p className="aml-tile-detail">
                      Closest match: {result.sanctions.matches[0].matched_name} ({result.sanctions.matches[0].score}% similarity)
                    </p>
                  )}
                </div>

                <div className={`aml-check-tile ${result.pep?.matched ? 'hit' : 'clear'}`}>
                  <div className="aml-tile-header">
                    <Users size={16} />
                    <span>PEP Screening</span>
                  </div>
                  <p className="aml-tile-status">
                    {result.pep?.matched ? 'Potential PEP match' : 'No PEP association'}
                  </p>
                  {result.pep?.matches?.[0] && (
                    <p className="aml-tile-detail">
                      {result.pep.matches[0].matched_name} &middot; {result.pep.matches[0].position}, {result.pep.matches[0].country}
                    </p>
                  )}
                </div>

                <div className={`aml-check-tile ${result.adverse_media?.flagged ? 'hit' : 'clear'}`}>
                  <div className="aml-tile-header">
                    <Newspaper size={16} />
                    <span>Adverse Media</span>
                  </div>
                  <p className="aml-tile-status">
                    {result.adverse_media?.flagged ? 'Negative news found' : 'No adverse media'}
                  </p>
                  {result.adverse_media?.hits?.[0] && (
                    <p className="aml-tile-detail">
                      "{result.adverse_media.hits[0].headline}" &mdash; {result.adverse_media.hits[0].source}
                    </p>
                  )}
                </div>

                <div className={`aml-check-tile ${result.source_of_funds?.risk_level === 'high' ? 'hit' : result.source_of_funds?.risk_level === 'medium' ? 'warn' : 'clear'}`}>
                  <div className="aml-tile-header">
                    <Wallet size={16} />
                    <span>Source of Funds</span>
                  </div>
                  <p className="aml-tile-status">
                    Risk level: {(result.source_of_funds?.risk_level || 'low').toUpperCase()}
                  </p>
                  <p className="aml-tile-detail">{result.source_of_funds?.reasoning}</p>
                </div>
              </div>

              <button className="primary-action-btn aml-continue-btn" onClick={handleContinue}>
                <span>Continue to Final Review</span>
                <ArrowRight size={18} />
              </button>

              <p className="aml-fine-print">
                All checks above run against synthetic demo data for illustration purposes only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
