import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import '../styles/aadhaar.css';

export default function MockDigilockerConsent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (aadhaar.length < 12) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      setTimeout(() => {
        window.location.href = '/digilocker/callback?status=success';
      }, 2000);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' }}>
      {/* Official Header */}
      <header style={{ backgroundColor: '#00264d', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India Emblem" style={{ height: '30px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>DigiLocker</h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Government of India</p>
          </div>
        </div>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="https://setu.co/favicon.png" alt="Setu" style={{ height: '24px', filter: 'brightness(0) invert(1)' }} />
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
        {/* Main Content Card */}
        <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '480px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid #eaeaea', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Sign In to your account</h2>
          </div>

          <div style={{ padding: '32px 24px' }}>
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: 'bold' }}>
                    Aadhaar/Mobile Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter Aadhaar Number" 
                    value={aadhaar} 
                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').substring(0, 12))}
                    style={{ 
                      width: '100%', padding: '12px 16px', borderRadius: '6px', 
                      border: '1px solid #d1d5db', fontSize: '16px', outline: 'none'
                    }}
                    autoFocus
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                    You can sign in using your 12-digit Aadhaar number.
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: 'bold' }}>
                    6 digit security PIN
                  </label>
                  <input 
                    type="password" 
                    placeholder="Enter security PIN" 
                    defaultValue="123456"
                    style={{ 
                      width: '100%', padding: '12px 16px', borderRadius: '6px', 
                      border: '1px solid #d1d5db', fontSize: '16px', outline: 'none'
                    }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#2563eb', cursor: 'pointer', textAlign: 'right' }}>
                    Forgot security PIN?
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={aadhaar.length < 12 || loading}
                  style={{
                    width: '100%', padding: '14px', backgroundColor: '#00264d', color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold',
                    cursor: aadhaar.length < 12 || loading ? 'not-allowed' : 'pointer',
                    opacity: aadhaar.length < 12 || loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : 'Sign In'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Shield size={48} color="#00264d" style={{ margin: '0 auto' }} />
                  <h3 style={{ margin: '16px 0 8px 0', fontSize: '18px', color: '#1f2937' }}>Verify OTP</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    DigiLocker has sent an OTP to your registered mobile ending in ****1234
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#4b5563', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                    Enter OTP
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    style={{ 
                      width: '100%', padding: '12px 16px', borderRadius: '6px', 
                      border: '1px solid #d1d5db', fontSize: '18px', letterSpacing: '4px',
                      textAlign: 'center', outline: 'none'
                    }}
                    autoFocus
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={otp.length < 6 || loading}
                  style={{
                    width: '100%', padding: '14px', backgroundColor: '#00264d', color: 'white',
                    border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold',
                    cursor: otp.length < 6 || loading ? 'not-allowed' : 'pointer',
                    opacity: otp.length < 6 || loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Verifying...' : 'Submit'}
                </button>
              </form>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginTop: '24px' }}>Authentication Successful</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                  Redirecting to the partner application...
                </p>
              </div>
            )}
          </div>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '16px 24px', fontSize: '12px', color: '#6b7280', textAlign: 'center', borderTop: '1px solid #eaeaea' }}>
            Powered by Setu DigiLocker API • Mock Sandbox Environment
          </div>
        </div>
      </div>
    </div>
  );
}
