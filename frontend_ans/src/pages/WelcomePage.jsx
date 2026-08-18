import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Zap, ArrowRight, Shield, Clock, Check, 
  Menu, X, CreditCard, FileText, Camera, UserCheck, 
  HelpCircle, ArrowUpRight, Landmark, Users, Building2
} from 'lucide-react';
import { useVerification } from '../context/VerificationContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/welcome.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { digilockerRequestId, aadhaarVerified } = useVerification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If returning from DigiLocker consent redirect, automatically navigate to Aadhaar verification page
  useEffect(() => {
    if (digilockerRequestId && !aadhaarVerified) {
      navigate('/verify/aadhaar', { replace: true });
    }
  }, [digilockerRequestId, aadhaarVerified, navigate]);

  const handleGetStarted = () => {
    navigate('/auth', { state: { mode: 'signup' } });
  };

  const handleSignInClick = (e) => {
    e.preventDefault();
    navigate('/auth', { state: { mode: 'signin' } });
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-layout">
      {/* Top Sticky Header */}
      <header className="landing-header">
        <div className="header-container">
          <div className="header-left">
            <button 
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="header-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="shield-logo-icon">
                <Shield size={20} className="shield-icon" />
              </div>
              <div className="brand-text-wrapper">
                <span className="brand-title">VerifyPay</span>
                <span className="brand-subtitle">IDENTITY</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className={`header-nav-center ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="nav-link">How it Works</button>
            <button type="button" onClick={() => scrollToSection('features')} className="nav-link">Features</button>
            <button type="button" onClick={() => scrollToSection('security')} className="nav-link">Security</button>
            <button type="button" onClick={() => scrollToSection('pricing')} className="nav-link">Pricing</button>
            <button type="button" onClick={() => scrollToSection('support')} className="nav-link">Support</button>
          </nav>

          {/* Right Header Actions */}
          <div className="header-right">
            <ThemeToggle />
            <button className="header-get-started-btn" onClick={handleGetStarted}>
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container hero-grid">
          {/* Left Column Content */}
          <div className="hero-content-col">
            <div className="trust-pill-badge">
              <Check size={14} className="green-check" />
              <span>Secure. Fast. Reliable.</span>
            </div>

            <h1 className="hero-main-heading">
              Verify your identity <br />
              <span className="blue-highlight">in minutes</span>
            </h1>

            <p className="hero-supporting-text">
              Complete your KYC verification securely and unlock seamless access to all VerifyPay services.
            </p>

            {/* 3 Benefit Pills as in Reference Image */}
            <div className="hero-pills-row">
              <div className="hero-benefit-pill">
                <Check size={14} className="pill-icon green" />
                <span>100% Secure</span>
              </div>

              <div className="hero-benefit-pill">
                <Clock size={14} className="pill-icon blue" />
                <span>Takes less than 2 minutes</span>
              </div>

              <div className="hero-benefit-pill">
                <Landmark size={14} className="pill-icon green" />
                <span>RBI Guidelines Compliant</span>
              </div>
            </div>

            <div className="hero-cta-wrapper">
              <button className="hero-primary-btn" onClick={handleGetStarted}>
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>

              <div className="encrypted-note">
                <ShieldCheck size={16} className="shield-check-icon" />
                <span>Your data is safe and encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Column Device Visual with Light Blue Circular Halo */}
          <div className="hero-visual-col">
            {/* Soft Light-Blue Circular Background Halo from Image */}
            <div className="circle-bg-halo" />

            <div className="visual-wrapper">
              {/* Dashed SVG Arch Lines */}
              <svg className="dashed-arches-svg" viewBox="0 0 460 460" fill="none">
                <path d="M 60 210 Q 180 80 230 180" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 230 280 Q 300 400 400 240" stroke="#BFDBFE" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>

              {/* Floating Top Left Card: Bank Level Security */}
              <div className="floating-card top-left-float">
                <div className="float-icon-box blue">
                  <Shield size={18} />
                </div>
                <strong>Bank Level Security</strong>
                <span>256-bit Encrypted</span>
              </div>

              {/* Floating Top Right Check Badge */}
              <div className="top-right-badge-check">
                <Check size={20} strokeWidth={2.5} />
              </div>

              {/* Floating Bottom Right Card: Fast & Easy */}
              <div className="floating-card bottom-right-float">
                <div className="float-icon-box amber">
                  <Zap size={18} />
                </div>
                <strong>Fast & Easy</strong>
                <span>Complete KYC in just a few steps</span>
              </div>

              {/* Smartphone Device Mockup */}
              <div className="smartphone-mockup-frame">
                <div className="phone-screen-inner">
                  {/* Phone Header */}
                  <div className="screen-header">
                    <div className="screen-status-bar">
                      <span className="phone-time">1:41</span>
                      <div className="phone-battery">
                        <div className="battery-level" />
                      </div>
                    </div>
                    <h4 className="phone-screen-title">Verification Progress</h4>

                    {/* Phone Dots Stepper Bar */}
                    <div className="phone-stepper-dots">
                      <div className="phone-dot-item">
                        <div className="dot-circle completed">
                          <Check size={12} strokeWidth={2.5} />
                        </div>
                        <span className="dot-label completed">Identity</span>
                      </div>
                      <div className="phone-dot-line completed" />
                      <div className="phone-dot-item">
                        <div className="dot-circle active">2</div>
                        <span className="dot-label active">PAN</span>
                      </div>
                      <div className="phone-dot-line" />
                      <div className="phone-dot-item">
                        <div className="dot-circle upcoming">3</div>
                        <span className="dot-label">Selfie</span>
                      </div>
                      <div className="phone-dot-line" />
                      <div className="phone-dot-item">
                        <div className="dot-circle upcoming">4</div>
                        <span className="dot-label">Review</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Steps Stack */}
                  <div className="phone-steps-stack">
                    <div className="phone-step-card completed">
                      <div className="phone-step-icon green">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="phone-step-info">
                        <strong>Identity Verification</strong>
                      </div>
                      <span className="phone-status-tag green">Completed</span>
                    </div>

                    <div className="phone-step-card active">
                      <div className="phone-step-icon blue">
                        <FileText size={14} />
                      </div>
                      <div className="phone-step-info">
                        <strong>PAN Verification</strong>
                      </div>
                      <span className="phone-status-tag blue">In Progress</span>
                    </div>

                    <div className="phone-step-card upcoming">
                      <div className="phone-step-icon gray">
                        <Camera size={14} />
                      </div>
                      <div className="phone-step-info">
                        <strong>Live Selfie Verification</strong>
                      </div>
                      <span className="phone-status-tag gray">Upcoming</span>
                    </div>

                    <div className="phone-step-card upcoming">
                      <div className="phone-step-icon gray">
                        <UserCheck size={14} />
                      </div>
                      <div className="phone-step-info">
                        <strong>Final Review</strong>
                      </div>
                      <span className="phone-status-tag gray">Upcoming</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip Section (Single White Container Card from Image) */}
      <section id="features" className="feature-strip-section">
        <div className="landing-container">
          <div className="features-white-container-card">
            <div className="feature-col-item">
              <div className="feature-icon-badge light-blue">
                <CreditCard size={20} />
              </div>
              <div className="feature-text-group">
                <h3>Seamless Verification</h3>
                <p>Verify using DigiLocker, OTP or document upload</p>
              </div>
            </div>

            <div className="feature-col-item">
              <div className="feature-icon-badge light-green">
                <Lock size={20} />
              </div>
              <div className="feature-text-group">
                <h3>Advanced Security</h3>
                <p>AI-powered validation with liveness & anti-fraud checks</p>
              </div>
            </div>

            <div className="feature-col-item">
              <div className="feature-icon-badge light-purple">
                <Zap size={20} />
              </div>
              <div className="feature-text-group">
                <h3>Instant Results</h3>
                <p>Get verification status instantly</p>
              </div>
            </div>

            <div className="feature-col-item">
              <div className="feature-icon-badge soft-orange">
                <FileText size={20} />
              </div>
              <div className="feature-text-group">
                <h3>All-in-One Platform</h3>
                <p>Aadhaar, PAN, Selfie & more – all in one place</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section (From Reference Image) */}
      <section className="statistics-section">
        <div className="landing-container">
          <div className="stats-white-container-card">
            <h3 className="stats-title">Trusted by thousands of users</h3>
            <div className="stats-grid">
              <div className="stat-item-box">
                <div className="stat-icon-circle green">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span className="stat-number-text">10M+</span>
                  <span className="stat-label-text">Verifications Completed</span>
                </div>
              </div>

              <div className="stat-item-box">
                <div className="stat-icon-circle blue">
                  <Users size={22} />
                </div>
                <div>
                  <span className="stat-number-text">5M+</span>
                  <span className="stat-label-text">Happy Users</span>
                </div>
              </div>

              <div className="stat-item-box">
                <div className="stat-icon-circle purple">
                  <Building2 size={22} />
                </div>
                <div>
                  <span className="stat-number-text">500+</span>
                  <span className="stat-label-text">Partnered Businesses</span>
                </div>
              </div>

              <div className="stat-item-box">
                <div className="stat-icon-circle green">
                  <Check size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="stat-number-text">99.9%</span>
                  <span className="stat-label-text">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-tag">Step-by-step Process</span>
            <h2 className="section-title">How VerifyPay works</h2>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <span className="step-num-badge">01</span>
              <h3>Enter identity details</h3>
              <p>Provide basic account credentials to initiate your secure KYC journey.</p>
            </div>

            <div className="how-step-card">
              <span className="step-num-badge">02</span>
              <h3>Verify Aadhaar and PAN</h3>
              <p>Connect DigiLocker and validate PAN details against tax records.</p>
            </div>

            <div className="how-step-card">
              <span className="step-num-badge">03</span>
              <h3>Complete live selfie</h3>
              <p>Perform a quick camera facial scan for biometric liveness verification.</p>
            </div>

            <div className="how-step-card">
              <span className="step-num-badge">04</span>
              <h3>Review your result</h3>
              <p>Confirm verified identity tokens and activate your account immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security-section">
        <div className="landing-container">
          <div className="security-banner-card">
            <span className="section-tag">Data Protection</span>
            <h2 className="section-title">Your identity is protected</h2>
            <p className="security-banner-desc">
              We employ bank-level 256-bit SSL encryption to safeguard all identity documents and biometrics.
            </p>

            <div className="security-checks-grid">
              <div className="sec-check-item">
                <Check size={16} className="green-check" />
                <span>Secure data transmission</span>
              </div>
              <div className="sec-check-item">
                <Check size={16} className="green-check" />
                <span>Encrypted verification</span>
              </div>
              <div className="sec-check-item">
                <Check size={16} className="green-check" />
                <span>Government-source verification</span>
              </div>
              <div className="sec-check-item">
                <Check size={16} className="green-check" />
                <span>Privacy-focused processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Support Sections */}
      <section id="pricing" className="pricing-support-section">
        <div className="landing-container pricing-support-grid">
          <div className="simple-card-box">
            <span className="section-tag">Flexible Options</span>
            <h3>Simple & Transparent Pricing</h3>
            <p>Verification workflows tailored for individual accounts and business onboarding.</p>
            <button className="secondary-action-btn" onClick={handleGetStarted}>
              <span>Explore Plan Options</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div id="support" className="simple-card-box">
            <span className="section-tag">24/7 Assistance</span>
            <h3>Need Support?</h3>
            <p>Our identity verification support specialists are here to assist you anytime.</p>
            <button className="support-btn" onClick={() => alert('Support team contacted. We will assist you shortly!')}>
              <HelpCircle size={15} />
              <span>Contact Support Team</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-row">
          <div className="footer-left">
            <div className="header-brand">
              <div className="shield-logo-icon">
                <Shield size={18} className="shield-icon" />
              </div>
              <div className="brand-text-wrapper">
                <span className="brand-title">VerifyPay</span>
                <span className="brand-subtitle">IDENTITY</span>
              </div>
            </div>
            <p className="copyright-text">
              © {new Date().getFullYear()} VerifyPay. All rights reserved. Secure Digital KYC Portal.
            </p>
          </div>

          <div className="footer-right">
            <span>Already have an account? </span>
            <a href="#signin" className="signin-link" onClick={handleSignInClick}>
              Sign in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
