import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle, Shield, 
  Mail, Phone, ShieldCheck, Check, Zap, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/auth.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, signin } = useAuth();
  const { digilockerRequestId, aadhaarVerified } = useVerification();

  // If returning from DigiLocker consent redirect, automatically navigate to Aadhaar verification page
  useEffect(() => {
    if (digilockerRequestId && !aadhaarVerified) {
      navigate('/verify/aadhaar', { replace: true });
    }
  }, [digilockerRequestId, aadhaarVerified, navigate]);

  // Default mode is 'signup' unless location state specifies 'signin'
  const initialMode = location.state?.mode === 'signin' ? 'signin' : 'signup';
  const [mode, setMode] = useState(initialMode);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState('');

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      const userIdentifier = fullName.trim() || username.trim() || email.trim();
      if (!userIdentifier) {
        setError('Please enter your name or username.');
        return;
      }
      if (!password) {
        setError('Please enter a strong password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        setError('You must agree to the Terms & Conditions.');
        return;
      }

      const res = signup(userIdentifier, password);
      if (res.success) {
        navigate('/verification-workflow');
      } else {
        setError(res.message);
      }
    } else {
      const userIdentifier = username.trim() || email.trim() || mobile.trim();
      if (!userIdentifier) {
        setError('Please enter your email, mobile number, or username.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      const res = signin(userIdentifier, password);
      if (res.success) {
        navigate('/verification-workflow');
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="auth-layout">
      {/* Top Floating Controls */}
      <div className="auth-top-controls">
        <button 
          className="auth-back-btn"
          onClick={() => navigate('/')}
          title="Back to Landing Page"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <ThemeToggle />
      </div>

      {/* Main Split Card Container */}
      <main className="auth-main-container">
        <div className="auth-split-card">
          {/* Left Column Illustration & Security Panel */}
          <div className="auth-left-panel">
            <div className="orbit-shield-container">
              <div className="orbit-ring" />
              
              {/* Orbiting Floating Icons */}
              <div className="orbit-icon-badge top-right-lock">
                <Lock size={14} />
              </div>
              <div className="orbit-icon-badge left-user">
                <User size={14} />
              </div>
              <div className="orbit-icon-badge bottom-right-doc">
                <ShieldCheck size={14} />
              </div>

              {/* Center Blue Shield with White Checkmark */}
              <div className="center-blue-shield">
                <Check size={38} strokeWidth={3} className="shield-check-mark" />
              </div>
            </div>

            <div className="left-panel-text">
              <h3 className="tagline-heading">
                <span className="green">Secure. </span>
                <span className="blue">Fast. </span>
                <span className="dark">Reliable.</span>
              </h3>
              <p className="tagline-sub">Your identity is protected with bank-level security.</p>
            </div>
          </div>

          {/* Right Column Form Area */}
          <div className="auth-right-panel">
            <div className="auth-form-wrapper">
              {/* Top Premium Segmented Tab Switcher for Sign Up and Sign In */}
              <div className="auth-segmented-control">
                <button 
                  type="button" 
                  className={`segmented-btn ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => handleTabChange('signup')}
                >
                  Sign Up
                </button>
                <button 
                  type="button" 
                  className={`segmented-btn ${mode === 'signin' ? 'active' : ''}`}
                  onClick={() => handleTabChange('signin')}
                >
                  Sign In
                </button>
              </div>

              {mode === 'signin' ? (
                <>
                  <div className="form-header">
                    <h2 className="form-title">Welcome back!</h2>
                    <p className="form-subtitle">Sign in to continue to VerifyPay</p>
                  </div>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="auth-error-msg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="signin-user">Email / Mobile Number</label>
                      <div className="input-with-icon">
                        <User size={18} className="field-icon" />
                        <input 
                          id="signin-user"
                          type="text" 
                          className="auth-input" 
                          placeholder="Enter your email or mobile number" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoComplete="username"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="signin-password">Password</label>
                      <div className="input-with-icon">
                        <Lock size={18} className="field-icon" />
                        <input 
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'} 
                          className="auth-input" 
                          placeholder="Enter your password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                        />
                        <button 
                          type="button" 
                          className="pw-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-options-row">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your registered email.'); }} className="forgot-link">
                        Forgot Password?
                      </a>
                    </div>

                    <button type="submit" className="auth-submit-btn">
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="form-header">
                    <h2 className="form-title">Create your account</h2>
                    <p className="form-subtitle">Sign up to get started with VerifyPay</p>
                  </div>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="auth-error-msg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="signup-fullname">Full Name</label>
                      <div className="input-with-icon">
                        <User size={18} className="field-icon" />
                        <input 
                          id="signup-fullname"
                          type="text" 
                          className="auth-input" 
                          placeholder="Enter your full name" 
                          value={fullName}
                          onChange={(e) => { setFullName(e.target.value); setUsername(e.target.value); }}
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-email">Email Address</label>
                      <div className="input-with-icon">
                        <Mail size={18} className="field-icon" />
                        <input 
                          id="signup-email"
                          type="email" 
                          className="auth-input" 
                          placeholder="Enter your email address" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-mobile">Mobile Number</label>
                      <div className="input-with-icon">
                        <Phone size={18} className="field-icon" />
                        <input 
                          id="signup-mobile"
                          type="tel" 
                          className="auth-input" 
                          placeholder="Enter your mobile number" 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-password">Password</label>
                      <div className="input-with-icon">
                        <Lock size={18} className="field-icon" />
                        <input 
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'} 
                          className="auth-input" 
                          placeholder="Create a strong password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <button 
                          type="button" 
                          className="pw-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="signup-confirm-password">Confirm Password</label>
                      <div className="input-with-icon">
                        <Lock size={18} className="field-icon" />
                        <input 
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'} 
                          className="auth-input" 
                          placeholder="Confirm your password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <button 
                          type="button" 
                          className="pw-toggle-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-options-row">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          required
                        />
                        <span>I agree to the <span className="blue-link">Terms & Conditions</span> and <span className="blue-link">Privacy Policy</span></span>
                      </label>
                    </div>

                    <button type="submit" className="auth-submit-btn">
                      <span>Sign Up</span>
                      <ArrowRight size={18} />
                    </button>
                  </form>
                </>
              )}

              {/* Social Login Divider & Button */}
              <div className="divider-row">
                <span className="divider-line" />
                <span className="divider-text">or continue with</span>
                <span className="divider-line" />
              </div>

              <button 
                type="button" 
                className="google-auth-btn"
                onClick={() => {
                  const demoName = mode === 'signup' ? 'Google User' : 'Shanjaynachiappan';
                  const res = signup(demoName, 'google-pass-123');
                  if (res.success) navigate('/verification-workflow');
                }}
              >
                <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Mode Switch Link */}
              <div className="bottom-toggle-text">
                {mode === 'signin' ? (
                  <>
                    <span>Don't have an account? </span>
                    <button type="button" onClick={() => handleTabChange('signup')} className="toggle-btn-link">
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button type="button" onClick={() => handleTabChange('signin')} className="toggle-btn-link">
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges matching reference screenshot */}
        <div className="auth-bottom-badges-strip">
          <div className="auth-badge-pill">
            <div className="badge-icon-box green">
              <ShieldCheck size={18} />
            </div>
            <div className="badge-text-box">
              <strong>Bank-Level Security</strong>
              <span>256-bit encrypted</span>
            </div>
          </div>

          <div className="auth-badge-pill">
            <div className="badge-icon-box blue">
              <Zap size={18} />
            </div>
            <div className="badge-text-box">
              <strong>Quick Verification</strong>
              <span>Complete KYC in minutes</span>
            </div>
          </div>

          <div className="auth-badge-pill">
            <div className="badge-icon-box purple">
              <Shield size={18} />
            </div>
            <div className="badge-text-box">
              <strong>Privacy Protected</strong>
              <span>Your data is always safe</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer-bar">
        <p>© {new Date().getFullYear()} VerifyPay. All rights reserved.</p>
      </footer>
    </div>
  );
}
