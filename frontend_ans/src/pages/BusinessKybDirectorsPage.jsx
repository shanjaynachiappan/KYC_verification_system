import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, X, User, Briefcase, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import '../styles/verification-workflow.css';

export default function BusinessKybDirectorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resetVerificationState } = useVerification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [representatives, setRepresentatives] = useState(() => {
    try {
      const saved = localStorage.getItem('kyb_representatives');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(representatives.length === 0);

  // Form states
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [din, setDin] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    localStorage.setItem('kyb_representatives', JSON.stringify(representatives));
    if (representatives.length === 0) {
      setIsAdding(true);
    }
  }, [representatives]);

  const handleAddRepresentative = (e) => {
    e.preventDefault();
    const newErrors = {};

    const name = fullName.trim();
    if (!name) {
      newErrors.fullName = 'Representative name is required.';
    }

    if (!role) {
      newErrors.role = 'Please select a representative role.';
    }

    const dinVal = din.trim();
    if (dinVal && !/^[0-9]{8}$/.test(dinVal)) {
      newErrors.din = 'Please enter a valid DIN format (8 digits).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setRepresentatives(prev => [
      ...prev,
      {
        fullName: name,
        role: role,
        din: dinVal,
        verificationStatus: 'pending'
      }
    ]);

    setFullName('');
    setRole('');
    setDin('');
    setErrors({});
    setIsAdding(false);
  };

  const removeRepresentative = (indexToRemove) => {
    setRepresentatives(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleVerifyIdentity = (index) => {
    // Save which representative is active
    localStorage.setItem('kyb_active_rep_index', index.toString());

    // Reset individual KYC state for a fresh start
    resetVerificationState();

    // Route to individual KYC
    navigate('/verification-workflow');
  };

  const isAllVerified = representatives.length > 0 && representatives.every(r => r.verificationStatus === 'verified');

  if (isAllVerified) {
    return (
      <div className="fintech-layout">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="fintech-dashboard-grid">
          <SidebarNav isOpen={isSidebarOpen} />
          <main className="fintech-main-content">
            <div className="fintech-success-view" style={{ marginTop: '2rem' }}>
              <div className="success-banner-header">
                <div className="success-check-badge">
                  <CheckCircle2 size={32} />
                </div>
                <h2>KYB Verification Completed</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
                All required company representatives have completed identity verification.
              </p>
              <button className="primary-action-btn" style={{ maxWidth: '300px', margin: '0 auto' }} onClick={() => navigate('/dashboard')}>
                <span>Continue to Dashboard</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </main>
          <RightInfoPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="fintech-layout">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="fintech-dashboard-grid">
        <SidebarNav isOpen={isSidebarOpen} />

        <main className="fintech-main-content">
          <div className="page-header-section">
            <h1 className="page-title">Company Representatives</h1>
            <p className="page-subtitle">
              Provide details of the directors or authorized representatives who need to complete identity verification.
            </p>
          </div>

          <div className="fintech-card">
            <div className="security-notice-banner" style={{ marginBottom: '1.5rem' }}>
              <div className="notice-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="notice-text">
                <strong>Secure Processing</strong>
                <p>Representative information is securely processed for KYB verification.</p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem', fontStyle: 'italic' }}>
              Currently, representative details are entered manually. In the production version, these details would be retrieved from an authorized company-data/MCA source.
            </p>

            {representatives.length > 0 && (
              <div className="representatives-list" style={{ marginBottom: '2rem' }}>
                {representatives.map((rep, idx) => (
                  <div key={idx} className="representative-card" style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: rep.verificationStatus === 'verified' ? 'rgba(34, 197, 94, 0.05)' : 'white'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rep.fullName}
                        {rep.verificationStatus === 'verified' && <CheckCircle2 size={16} color="var(--success-color)" />}
                      </h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <span>{rep.role}</span>
                        {rep.din && <span style={{ marginLeft: '12px' }}>DIN: {rep.din}</span>}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: '500', color: rep.verificationStatus === 'verified' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                        {rep.verificationStatus === 'verified' ? '✓ Identity Verified' : 'Verification pending'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {rep.verificationStatus !== 'verified' && (
                        <button
                          className="primary-action-btn"
                          style={{ padding: '0.5rem 1rem', width: 'auto', minWidth: '0' }}
                          onClick={() => handleVerifyIdentity(idx)}
                        >
                          Verify Identity
                        </button>
                      )}

                      {rep.verificationStatus !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => removeRepresentative(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    style={{
                      background: 'none',
                      border: '1px dashed var(--border-light)',
                      borderRadius: '8px',
                      padding: '1rem',
                      width: '100%',
                      color: 'var(--primary-color)',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <UserPlus size={18} />
                    Add Another Representative
                  </button>
                )}
              </div>
            )}

            {isAdding && (
              <div style={{
                background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.05), 0 8px 10px -6px rgba(59, 130, 246, 0.01)',
                marginTop: representatives.length > 0 ? '1rem' : '0',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: 'linear-gradient(to bottom, #3b82f6, #60a5fa)'
                }} />

                <h3 style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#1e293b',
                  fontSize: '1.25rem'
                }}>
                  <div style={{
                    background: '#eff6ff',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#3b82f6'
                  }}>
                    <UserPlus size={20} />
                  </div>
                  {representatives.length > 0 ? 'Add Representative' : 'Add Company Representative'}
                </h3>

                <form className="fintech-form" onSubmit={handleAddRepresentative}>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="rep-name">Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="field-icon" />
                      <input
                        id="rep-name"
                        type="text"
                        className="fintech-input"
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    {errors.fullName && (
                      <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                        <AlertCircle size={14} />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="rep-role">Role</label>
                    <div className="input-with-icon">
                      <Briefcase size={18} className="field-icon" />
                      <select
                        id="rep-role"
                        className="fintech-input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                      >
                        <option value="">Select role...</option>
                        <option value="Director">Director</option>
                        <option value="Authorized Representative">Authorized Representative</option>
                      </select>
                    </div>
                    {errors.role && (
                      <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                        <AlertCircle size={14} />
                        <span>{errors.role}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label htmlFor="rep-din">DIN (Optional)</label>
                    <div className="input-with-icon">
                      <Hash size={18} className="field-icon" />
                      <input
                        id="rep-din"
                        type="text"
                        className="fintech-input"
                        placeholder="Enter DIN if available"
                        value={din}
                        onChange={(e) => setDin(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={8}
                      />
                    </div>
                    {errors.din && (
                      <div className="fintech-error-msg" style={{ marginTop: '0.5rem' }}>
                        <AlertCircle size={14} />
                        <span>{errors.din}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="primary-action-btn" style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
                      border: 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <UserPlus size={18} />
                      <span>Add Representative</span>
                    </button>

                    {representatives.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdding(false);
                          setErrors({});
                        }}
                        className="secondary-action-btn"
                        style={{
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          padding: '0.8rem 1.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#475569',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
