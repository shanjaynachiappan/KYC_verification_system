import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/auth.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, signin } = useAuth();

  const initialMode = location.state?.mode === 'signin' ? 'signin' : 'signup';
  const [mode, setMode] = useState(initialMode);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a valid username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      const res = signup(username, password);
      if (res.success) {
        navigate('/verification-workflow');
      } else {
        setError(res.message);
      }
    } else {
      const res = signin(username, password);
      if (res.success) {
        navigate('/verification-workflow');
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="bg-glow bg-glow-top"></div>
      <div className="bg-glow bg-glow-bottom"></div>

      <div className="auth-card-wrapper">
        {/* Auth Top Bar */}
        <header className="auth-header">
          <button 
            className="back-btn" 
            onClick={() => navigate('/')} 
            aria-label="Back to welcome page"
            title="Back to Welcome Page"
          >
            <ArrowLeft size={18} />
          </button>
          <ThemeToggle />
        </header>

        {/* Auth Body */}
        <main className="auth-main">
          {/* Title & Subtitle */}
          <div className="auth-titles">
            <h1 className="auth-title">
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="auth-subtitle">
              {mode === 'signup' 
                ? 'Register to start your KYC journey' 
                : 'Sign in to access your KYC dashboard'}
            </p>
          </div>

          {/* Segmented Control Switcher */}
          <div className="segmented-control">
            <button 
              className={`segmented-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
              type="button"
            >
              Sign Up
            </button>
            <button 
              className={`segmented-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => handleTabChange('signin')}
              type="button"
            >
              Sign In
            </button>
          </div>

          {/* Form Area */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="input-label" htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  id="username"
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </main>

        {/* Auth Footer */}
        <footer className="auth-footer">
          <p className="terms-text">
            By continuing, you agree to our{' '}
            <span className="terms-link">Terms of Service</span> and{' '}
            <span className="terms-link">Privacy Policy</span>.
          </p>
        </footer>
      </div>
    </div>
  );
}
