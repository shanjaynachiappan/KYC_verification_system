import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import '../styles/verification-workflow.css';
import '../styles/pan.css';

export default function BusinessKybEntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('input'); // 'input' | 'loading' | 'success'

  const usernameDisplay = user?.username || 'Business Owner';

  const handleVerify = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company legal name is required.';
    }
    if (!cin.trim()) {
      newErrors.cin = 'CIN is required.';
    }
    if (!gstin.trim()) {
      newErrors.gstin = 'GSTIN is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatus('loading');

    try {
      const response = await fetch('http://localhost:8000/kyb/validate-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyName,
          cin: cin,
          gstin: gstin
        })
      });

      const data = await response.json();

      if (!data.valid) {
        if (!data.company_name_valid) newErrors.companyName = data.company_name_error;
        if (!data.cin_valid) newErrors.cin = data.cin_error;
        if (!data.gstin_valid) newErrors.gstin = data.gstin_error;
        
        setErrors(newErrors);
        setStatus('input');
        return;
      }

      setStatus('success');
      
      // Auto transition after a few seconds
      setTimeout(() => {
        navigate('/kyb-directors');
      }, 3000);
      
    } catch (error) {
      console.error('Validation error:', error);
      setErrors({ gstin: 'Failed to connect to verification service. Please try again.' });
      setStatus('input');
    }
  };

  return (
    <div className="fintech-layout">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="fintech-dashboard-grid">
        <SidebarNav isOpen={isSidebarOpen} />

        <main className="fintech-main-content">
          <div className="page-header-section">
            <h1 className="page-title">Verify Your Business</h1>
            <p className="page-subtitle">
              Let's verify your company details to continue with your business account.
            </p>
          </div>

          <div className="fintech-card">
            <div className="security-notice-banner">
              <div className="notice-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="notice-text">
                <strong>Secure Business Verification</strong>
                <p>Your company details are securely processed.</p>
              </div>
            </div>

            {status === 'input' && (
              <form className="fintech-form" onSubmit={handleVerify}>
                
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="company-name">Company Legal Name</label>
                  <div className="input-with-icon">
                    <Building2 size={18} className="field-icon" />
                    <input 
                      id="company-name"
                      type="text" 
                      className="fintech-input"
                      placeholder="Enter your company's legal name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  {errors.companyName && (
                    <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                      <AlertCircle size={14} />
                      <span>{errors.companyName}</span>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="company-cin">Corporate Identification Number (CIN)</label>
                  <div className="input-with-icon">
                    <FileText size={18} className="field-icon" />
                    <input 
                      id="company-cin"
                      type="text" 
                      className="fintech-input uppercase"
                      placeholder="Enter your CIN"
                      value={cin}
                      onChange={(e) => setCin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                  </div>
                  {errors.cin && (
                    <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                      <AlertCircle size={14} />
                      <span>{errors.cin}</span>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label htmlFor="company-gstin">GST Identification Number (GSTIN)</label>
                  <div className="input-with-icon">
                    <FileText size={18} className="field-icon" />
                    <input 
                      id="company-gstin"
                      type="text" 
                      className="fintech-input uppercase"
                      placeholder="Enter your GSTIN"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                  </div>
                  {errors.gstin && (
                    <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                      <AlertCircle size={14} />
                      <span>{errors.gstin}</span>
                    </div>
                  )}
                </div>

                <button type="submit" className="primary-action-btn">
                  <ShieldCheck size={18} />
                  <span>Verify Company</span>
                </button>
              </form>
            )}

            {status === 'loading' && (
              <div className="fintech-loading-box" style={{ padding: '40px 0', textAlign: 'center' }}>
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">Validating Company Details...</h3>
                <p className="loading-desc">Please wait while we perform local structure and format validation.</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="fintech-success-view">
                <div className="success-banner-header">
                  <div className="success-check-badge">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3>Basic company validation successful</h3>
                </div>

                <div className="details-table" style={{ marginBottom: '20px' }}>
                  <div className="table-row">
                    <span className="row-label">Company Name</span>
                    <span className="row-val green-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Company name provided
                    </span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">CIN Check</span>
                    <span className="row-val green-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Valid CIN format
                    </span>
                  </div>
                  <div className="table-row">
                    <span className="row-label">GSTIN Check</span>
                    <span className="row-val green-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Valid GSTIN
                    </span>
                  </div>
                </div>
                
                <button className="primary-action-btn" onClick={() => navigate('/kyb-directors')}>
                  <span>Continue to Next Step</span>
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
