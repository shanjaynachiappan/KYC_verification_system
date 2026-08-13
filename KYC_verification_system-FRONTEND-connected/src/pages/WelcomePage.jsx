import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Badge from '../components/Badge';
import '../styles/welcome.css';

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth', { state: { mode: 'signup' } });
  };

  const handleSignInClick = (e) => {
    e.preventDefault();
    navigate('/auth', { state: { mode: 'signin' } });
  };

  return (
    <div className="welcome-container">
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="welcome-card-wrapper">
        {/* Top Header Nav */}
        <header className="welcome-header">
          <Logo />
          <ThemeToggle />
        </header>

        {/* Main Content Area */}
        <main className="welcome-main">
          {/* Hero Illustration Card */}
          <div className="illustration-card-container">
            <div className="illustration-glow"></div>
            <div className="illustration-card">
              <div className="kyc-graphic">
                <div className="graphic-badge top-right-badge">
                  <ShieldCheck size={16} className="badge-icon" />
                  <span>2FA Active</span>
                </div>

                <div className="graphic-badge bottom-left-badge">
                  <CheckCircle2 size={16} className="badge-icon success" />
                  <span>ID Verified</span>
                </div>

                {/* ID Card Display */}
                <div className="id-card-mockup">
                  <div className="card-header-bar">
                    <div className="card-chip"></div>
                    <div className="card-logo-mini">VP</div>
                  </div>

                  <div className="card-body">
                    <div className="avatar-frame">
                      <div className="avatar-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="scan-line"></div>
                    </div>

                    <div className="card-details">
                      <div className="detail-line long"></div>
                      <div className="detail-line medium"></div>
                      <div className="detail-line short"></div>
                      <div className="verification-status">
                        <span className="status-dot"></span>
                        <span>Encrypted 256-bit</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating center shield lock */}
                <div className="center-shield-glow">
                  <Lock size={24} className="lock-icon" />
                </div>
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-content">
            <h1 className="main-heading">Verify your identity in minutes</h1>
            <p className="sub-heading">
              A seamless, secure KYC experience. Your data is encrypted end-to-end.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="badges-container">
            <Badge icon={Lock} label="256-bit SSL" />
            <Badge icon={ShieldCheck} label="RBI Compliant" />
            <Badge icon={Zap} label="Instant KYC" />
          </div>

          {/* Primary Action Button */}
          <div className="action-container">
            <button className="get-started-btn" onClick={handleGetStarted}>
              <span>Get Started</span>
              <ArrowRight size={18} className="btn-arrow" />
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="welcome-footer">
          <p className="footer-text">
            Already have an account?{' '}
            <a href="#signin" className="signin-link" onClick={handleSignInClick}>
              Sign in
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
