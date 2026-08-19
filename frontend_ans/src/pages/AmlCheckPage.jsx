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

// Must stay in sync with app/sof.py's INCOME_BANDS_ORDER / SOURCE_RISK keys.
const INCOME_BANDS = [
  'Below ₹5L/yr',
  '₹5L–15L/yr',
  '₹15L–50L/yr',
  '₹50L–1Cr/yr',
  'Above ₹1Cr/yr',
];

const SOURCE_OPTIONS = [
  'Salaried employment',
  'Business income (registered entity)',
  'Freelance / consulting income',
  'Property sale proceeds',
  'Inheritance / gift',
  'Overseas remittance',
  'Cash-intensive trade business',
];

// Cycled while the backend call is in flight, purely cosmetic so the
// checking state doesn't feel frozen during the round trip.
const CHECK_STEPS = [
  { icon: ShieldCheck, text: 'Screening against global sanctions lists...' },
  { icon: Users, text: 'Checking Politically Exposed Person (PEP) databases...' },
  { icon: Newspaper, text: 'Scanning adverse media & negative news sources...' },
  { icon: Wallet, text: 'Assessing declared source of funds...' },
];

export default function AmlCheckPage() {
  const navigate = useNavigate();
  const { userId, aadhaarData, markAmlChecked, amlChecked, amlResult } = useVerification();

  // 'declaring' | 'checking' | 'success' | 'flagged' | 'error'
  const [status, setStatus] = useState('declaring');
  const [incomeBand, setIncomeBand] = useState('');
  const [source, setSource] = useState('');
  const [formError, setFormError] = useState('');

  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const cycleRef = useRef(null);

  // If this screen is revisited after already completing the check once,
  // just show the stored result instead of asking the applicant again.
  useEffect(() => {
    if (amlChecked && amlResult) {
      setResult(amlResult);
      const isFlagged = amlResult.sanctions?.matched || amlResult.pep?.matched ||
        amlResult.adverse_media?.flagged || amlResult.source_of_funds?.risk_level === 'high';
      setStatus(isFlagged ? 'flagged' : 'success');
    }
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, []);

  const runCheck = async () => {
    const nameToScreen = aadhaarData?.fullName || aadhaarData?.name;

    if (!userId || !nameToScreen) {
      setErrorMessage('Missing verified identity details. Please complete Aadhaar verification first.');
      setStatus('error');
      return;
    }

    setStatus('checking');
    setErrorMessage('');
    setStepIndex(0);
    cycleRef.current = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % CHECK_STEPS.length);
    }, 900);

    try {
      const data = await runAmlCheck(userId, nameToScreen, incomeBand, source);
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

  const handleDeclareSubmit = (e) => {
    e.preventDefault();
    if (!incomeBand || !source) {
      setFormError('Please select both your income band and source of funds.');
      return;
    }
    setFormError('');
    runCheck();
  };

  const handleContinue = () => {
    navigate('/verify/review');
  };

  const CurrentIcon = CHECK_STEPS[stepIndex].icon;

  return (
    <div className="fintech-layout aml-layout">
      <Header />

      <div className="aml-check-shell">
        <div className="aml-check-card">

          {status === 'declaring' && (
            <form className="aml-declare-form" onSubmit={handleDeclareSubmit}>
              <div className="aml-icon-wrapper primary">
                <Wallet size={26} />
              </div>
              <h2 className="aml-title">Declare Source of Funds</h2>
              <p className="aml-subtext">
                Before running your compliance check, tell us about your income so we can
                assess source-of-funds risk accurately.
              </p>

              <label className="aml-form-label">
                Annual income band
                <select
                  className="aml-form-select"
                  value={incomeBand}
                  onChange={(e) => setIncomeBand(e.target.value)}
                >
                  <option value="" disabled>Select income band</option>
                  {INCOME_BANDS.map((band) => (
                    <option key={band} value={band}>{band}</option>
                  ))}
                </select>
              </label>

              <label className="aml-form-label">
                Primary source of funds
                <select
                  className="aml-form-select"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="" disabled>Select source of funds</option>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              {formError && <p className="aml-form-error">{formError}</p>}

              <button type="submit" className="primary-action-btn aml-continue-btn">
                <span>Run Compliance Check</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

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
              <button className="primary-action-btn" onClick={() => setStatus('declaring')}>
                <RefreshCw size={16} />
                <span>Try Again</span>
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
                Sanctions/PEP/adverse-media checks run against synthetic demo data for illustration purposes only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
