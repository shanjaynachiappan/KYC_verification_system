import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/auth.css';

export default function AccountTypePage() {
  const navigate = useNavigate();
  const { updateAccountType } = useAuth();

  const handleSelect = (type) => {
    updateAccountType(type);
    navigate('/product-type');
  };

  return (
    <div className="auth-layout">
      {/* Top Floating Controls */}
      <div className="auth-top-controls">
        <button 
          className="auth-back-btn"
          onClick={() => navigate(-1)}
          title="Back"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Split Card Container */}
      <main className="auth-main-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="auth-split-card" style={{ display: 'block', padding: '2rem' }}>
          
          <div className="form-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="form-title">Account Type</h2>
            <p className="form-subtitle">How are you opening your account?</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => handleSelect('individual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-main)',
                width: '100%'
              }}
              className="type-select-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <User size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#000000' }}>Individual</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>For personal use and savings.</span>
                </div>
              </div>
              <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
            </button>

            <button 
              onClick={() => handleSelect('business')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                background: 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'var(--text-main)',
                width: '100%'
              }}
              className="type-select-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Briefcase size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#000000' }}>Business</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>For companies and organizations.</span>
                </div>
              </div>
              <ArrowRight size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          
        </div>
      </main>
      
      <footer className="auth-footer-bar">
        <p>© {new Date().getFullYear()} VerifyPay. All rights reserved.</p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .type-select-btn:hover {
          border-color: #3b82f6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
          transform: translateY(-2px);
        }
      `}} />
    </div>
  );
}
