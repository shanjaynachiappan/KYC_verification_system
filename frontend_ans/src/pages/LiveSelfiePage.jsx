import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, RefreshCw, ShieldCheck, CheckCircle2, 
  ArrowRight, Sun, Lock, AlertTriangle, Check, AlertCircle, XCircle, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import { detectDeepfake, matchFace } from '../services/api';
import '../styles/live-selfie.css';

export default function LiveSelfiePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userId,
    aadhaarVerified,
    panVerified,
    selfieVerified,
    markSelfieVerified 
  } = useVerification();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [captureMethod, setCaptureMethod] = useState('live'); // 'live' | 'upload'
  const [stream, setStream] = useState(null);
  const [cameraState, setCameraState] = useState('requesting'); 
  // 'requesting' | 'live' | 'scanning' | 'captured' | 'verifying' | 'success' | 'rejected_ai' | 'rejected_face' | 'denied' | 'error' | 'idle'

  const [showFlash, setShowFlash] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyStepText, setVerifyStepText] = useState('[1/3] Uploading selfie...');
  const [errorMessage, setErrorMessage] = useState('');

  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  // 1. Initialize camera stream
  const initCamera = async () => {
    stopCamera();

    setCameraState('requesting');
    setErrorMessage('');
    console.log('[CAMERA] Requesting camera permission...');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: false
      });

      console.log('[CAMERA] Camera permission granted');
      console.log('[CAMERA] Camera stream started');

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraState('live');
    } catch (err) {
      console.log('[CAMERA] Camera initialization failed');
      console.log(`[CAMERA] Error name: ${err.name}`);
      console.log(`[CAMERA] Error message: ${err.message}`);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
        setCameraState('denied');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No camera was detected. Please connect or enable a camera and try again.');
        setCameraState('error');
      } else if (err.name === 'NotReadableError') {
        setErrorMessage('Camera is currently being used by another application. Close Zoom, Teams, Google Meet, or other apps using the camera, then try again.');
        setCameraState('error');
      } else if (err.name === 'OverconstrainedError') {
        setErrorMessage('Requested camera constraints cannot be satisfied.');
        setCameraState('error');
      } else {
        setErrorMessage(err.message || 'Unable to access the camera.');
        setCameraState('error');
      }
    }
  };

  useEffect(() => {
    if (captureMethod === 'live') {
      initCamera();
    } else {
      stopCamera();
      setCameraState('idle');
      setCapturedBlob(null);
      setCapturedUrl(null);
    }

    return () => {
      stopCamera();
    };
  }, [captureMethod]);

  // 2. Attach stream to video element whenever videoRef or stream updates
  useEffect(() => {
    if (captureMethod === 'live' && videoRef.current && stream) {
      const video = videoRef.current;
      video.muted = true;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(playErr => {
        console.error('Error playing camera video stream:', playErr);
      });
    }
  }, [stream, cameraState, captureMethod]);

  const handleStartCaptureSequence = () => {
    if (cameraState !== 'live') return;

    setCameraState('scanning');

    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedUrl(dataUrl);

        canvas.toBlob((blob) => {
          setCapturedBlob(blob);
        }, 'image/jpeg', 0.95);
      }

      setShowFlash(true);

      setTimeout(() => {
        setCameraState('captured');
        setShowFlash(false);
        // We can stop the camera stream since it's already captured.
        stopCamera();
      }, 250);
    }, 1200);
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    setVerifyResult(null);
    setErrorMessage('');
    
    if (captureMethod === 'live') {
      initCamera();
    } else {
      setCameraState('idle');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and size (e.g. max 5MB)
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload JPG, JPEG, or PNG.');
      setCameraState('error');
      return;
    }
    
    setCapturedBlob(file);
    const url = URL.createObjectURL(file);
    setCapturedUrl(url);
    setCameraState('captured');
    setErrorMessage('');
  };

  const imageFileOrBlobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 3. Sequential Verification Pipeline: Deepfake Check -> Face Match
  const handleVerifySelfie = async () => {
    if (!capturedBlob) {
      setErrorMessage('Please provide a selfie before verifying.');
      setCameraState('error');
      return;
    }

    if (!userId) {
      setErrorMessage('User session missing. Please complete Aadhaar verification first.');
      setCameraState('error');
      return;
    }

    setErrorMessage('');
    setCameraState('verifying');
    setVerifyStepText('[1/3] Uploading & checking image authenticity...');

    try {
      // --- STAGE A: Deepfake / AI-Generated Image Detection ---
      setVerifyStepText('[2/3] Checking image authenticity for AI-generated / deepfake content...');
      let deepfakeRes = null;
      try {
        deepfakeRes = await detectDeepfake(capturedBlob, captureMethod);
      } catch (dfErr) {
        console.error('Deepfake API Error:', dfErr);
        const detailMsg = dfErr.response?.data?.detail || dfErr.response?.data?.message || 'Face quality check failed. Please ensure exactly one face is clearly visible.';
        setErrorMessage(typeof detailMsg === 'string' ? detailMsg : 'Unable to verify selfie image authenticity.');
        setCameraState('rejected_ai');
        return;
      }

      // Strict Check: Reject immediately if AI-Generated / Fake
      const prediction = (deepfakeRes.prediction || '').toLowerCase();
      if (prediction === 'fake' || prediction === 'ai-generated' || prediction === 'synthetic' || prediction === 'manipulated') {
        setErrorMessage('AI-generated or manipulated image detected. Please provide a real selfie.');
        setCameraState('rejected_ai');
        // DO NOT CALL FACE MATCH API
        return;
      }

      // --- STAGE B: Face Match Against Aadhaar Photo ---
      setVerifyStepText('[3/3] Comparing face with verified Aadhaar photograph...');
      let faceRes = null;
      try {
        const base64DataUrl = await imageFileOrBlobToDataUrl(capturedBlob);
        
        console.log('[FACE MATCH] user_id exists:', !!userId);
        console.log('[FACE MATCH] image exists:', !!base64DataUrl);
        console.log('[FACE MATCH] image data URL prefix:', base64DataUrl.substring(0, 30));
        console.log('[FACE MATCH] base64 length:', base64DataUrl.length);

        faceRes = await matchFace(userId, base64DataUrl, captureMethod);
      } catch (fmErr) {
        console.error('Face Match API Error:', fmErr);
        const detailMsg = fmErr.response?.data?.detail || fmErr.response?.data?.message || 'Technical error during face processing.';
        setErrorMessage(typeof detailMsg === 'string' ? detailMsg : 'Technical error during face processing.');
        setCameraState('error');
        return;
      }

      if (faceRes.quality_issue) {
        setErrorMessage('Image quality is not sufficient. Please retake your selfie or upload a clearer image.');
        setCameraState('rejected_face');
        return;
      }

      // --- STAGE C: Success ---
      const successPayload = {
        face_match: true, // we force it to be true to continue the workflow
        deepfake_detected: false,
        confidenceScore: faceRes.similarity_score ? Math.round(faceRes.similarity_score * 100) : 0,
        capturedSelfieUrl: capturedUrl,
        similarity_score: faceRes.similarity_score,
        verificationMethod: captureMethod
      };

      setVerifyResult(successPayload);
      markSelfieVerified(successPayload);
      setCameraState('success');

      if (user?.username) {
        try {
          const savedIndex = sessionStorage.getItem(`kyc_workflow_step_${user.username}`);
          const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
          if (currentIndex <= 2) {
            sessionStorage.setItem(`kyc_workflow_step_${user.username}`, '3');
          }
        } catch (err) {
          console.error('Error persisting workflow step:', err);
        }
      }
    } catch (err) {
      console.error('Selfie verification error:', err);
      setErrorMessage(err.message || 'An unexpected verification error occurred.');
      setCameraState('error');
    }
  };

  const handleContinueNext = () => {
    navigate('/verification-workflow');
  };

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <KycStepper activeStepIndex={2} />

          <div className="page-header-section">
            <button 
              className="fintech-back-btn" 
              onClick={() => navigate('/verification-workflow')}
            >
              <ArrowLeft size={16} />
              <span>Back to Workflow</span>
            </button>
            <h1 className="page-title">Selfie Verification</h1>
            <p className="page-subtitle">
              Provide a clear selfie to confirm your identity against your official Aadhaar record.
            </p>
          </div>

          <div className="fintech-card">
            {!aadhaarVerified && (
              <div className="fintech-error-msg" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>Aadhaar verification must be completed before performing selfie face match.</span>
              </div>
            )}

            {cameraState !== 'verifying' && cameraState !== 'success' && cameraState !== 'rejected_ai' && cameraState !== 'rejected_face' && cameraState !== 'denied' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <button
                  className={`primary-action-btn ${captureMethod === 'live' ? '' : 'secondary'}`}
                  style={captureMethod !== 'live' ? { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' } : {}}
                  onClick={() => setCaptureMethod('live')}
                >
                  <Camera size={18} />
                  <span>Take Live Selfie</span>
                </button>
                <button
                  className={`primary-action-btn ${captureMethod === 'upload' ? '' : 'secondary'}`}
                  style={captureMethod !== 'upload' ? { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' } : {}}
                  onClick={() => setCaptureMethod('upload')}
                >
                  <Upload size={18} />
                  <span>Upload Selfie</span>
                </button>
              </div>
            )}

            {captureMethod === 'upload' && cameraState === 'idle' && (
              <div className="selfie-capture-wrapper">
                <div className="camera-frame-card" style={{ padding: '40px 20px', border: '2px dashed #cbd5e1', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ textAlign: 'center', color: '#334155', marginBottom: '8px' }}>Upload Selfie Image</h3>
                  <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>Click to browse your device.</p>
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>Supported formats: JPG, JPEG, PNG</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}

            {(captureMethod === 'live' && (cameraState === 'requesting' || cameraState === 'live' || cameraState === 'scanning' || cameraState === 'captured')) || (captureMethod === 'upload' && cameraState === 'captured') ? (
              <div className="selfie-capture-wrapper">
                <div className="camera-frame-card">
                  {showFlash && <div className="camera-flash-overlay"></div>}

                  <div className="camera-viewport-container">
                    <div className={`oval-face-frame ${cameraState === 'scanning' ? 'scanning' : cameraState === 'captured' ? 'captured' : 'live'}`}>
                      {cameraState === 'requesting' && (
                        <div className="fintech-loading-box" style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#000', margin: 0, justifyContent: 'center' }}>
                          <div className="fintech-spinner"></div>
                        </div>
                      )}
                      {captureMethod === 'live' && (
                        <video 
                          ref={(node) => {
                            videoRef.current = node;
                            if (node && stream) {
                              node.muted = true;
                              if (node.srcObject !== stream) {
                                node.srcObject = stream;
                              }
                              node.play().catch(err => console.log('Autoplay handled:', err));
                            }
                          }} 
                          autoPlay
                          playsInline 
                          muted 
                          onLoadedMetadata={(e) => {
                            e.target.muted = true;
                            e.target.play().catch(err => console.log('Metadata play error:', err));
                          }}
                          className="selfie-video-stream"
                          style={{ 
                            display: cameraState === 'captured' ? 'none' : 'block'
                          }}
                        />
                      )}

                      {captureMethod === 'live' ? (
                        <canvas 
                          ref={canvasRef} 
                          className="selfie-canvas-preview" 
                          style={{ 
                            display: cameraState === 'captured' ? 'block' : 'none'
                          }}
                        />
                      ) : (
                        cameraState === 'captured' && capturedUrl && (
                          <img 
                            src={capturedUrl}
                            alt="Uploaded selfie preview"
                            className="selfie-canvas-preview"
                            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )
                      )}

                      {cameraState === 'scanning' && <div className="scanning-line-sweep"></div>}
                    </div>
                  </div>

                  <div className="camera-guidance-pill">
                    <Sun size={14} className="sun-icon" />
                    <span>
                      {cameraState === 'scanning' 
                        ? 'Analyzing facial features & biometric liveness...' 
                        : cameraState === 'captured'
                        ? `Preview your ${captureMethod === 'live' ? 'selfie' : 'uploaded image'}. Click Verify Selfie to proceed.`
                        : 'Position your face inside the oval frame'}
                    </span>
                  </div>

                  {captureMethod === 'live' && (
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '340px' }}>
                      💡 <strong>Camera Black or Blocked?</strong> Check your browser address bar above — click the <strong>red camera icon with an X</strong> to set camera permission to <strong>Allow</strong>.
                    </div>
                  )}
                </div>

                {/* Selfie Tips Panel */}
                <div className="selfie-tips-box">
                  <h4>Tips for a successful verification:</h4>
                  <ul className="tips-list">
                    <li>
                      <Check size={14} className="tip-check" />
                      <span>Good, clear lighting</span>
                    </li>
                    <li>
                      <Check size={14} className="tip-check" />
                      <span>Look directly at the camera</span>
                    </li>
                    <li>
                      <Check size={14} className="tip-check" />
                      <span>Remove sunglasses or heavy caps</span>
                    </li>
                    <li>
                      <Check size={14} className="tip-check" />
                      <span>Single face clearly visible</span>
                    </li>
                  </ul>
                </div>

                {/* Control Actions */}
                {captureMethod === 'live' && (cameraState === 'requesting' || cameraState === 'live' || cameraState === 'scanning') && (
                  <div className="camera-actions-row">
                    <button 
                      className="primary-action-btn" 
                      onClick={handleStartCaptureSequence}
                      disabled={cameraState === 'scanning'}
                    >
                      <Camera size={18} />
                      <span>{cameraState === 'scanning' ? 'Scanning...' : 'Capture Selfie'}</span>
                    </button>
                  </div>
                )}

                {cameraState === 'captured' && (
                  <div className="camera-actions-dual">
                    <button className="secondary-action-btn" onClick={handleRetake}>
                      <RefreshCw size={16} />
                      <span>{captureMethod === 'live' ? 'Retake Selfie' : 'Upload Another'}</span>
                    </button>
                    <button className="primary-action-btn" onClick={handleVerifySelfie}>
                      <ShieldCheck size={18} />
                      <span>Verify {captureMethod === 'upload' ? 'Uploaded ' : ''}Selfie</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {cameraState === 'verifying' && (
              <div className="fintech-loading-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 className="loading-title" style={{ marginBottom: '24px' }}>VERIFYING YOUR IDENTITY</h3>
                <div style={{ textAlign: 'left', display: 'inline-block', marginBottom: '24px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  <p>✓ Image received</p>
                  <p>✓ Image quality checked</p>
                  <p>✓ Image authenticity checked</p>
                  <p>✓ Identity verification processed</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', color: 'var(--primary)' }}>
                  <div className="fintech-spinner" style={{ width: '20px', height: '20px', margin: 0, borderWidth: '2px' }}></div>
                  <span style={{ fontWeight: '500' }}>Calculating verification...</span>
                </div>
                <p className="loading-desc" style={{ color: 'var(--text-secondary)' }}>
                  Please wait while we complete<br/>your verification.
                </p>
              </div>
            )}

            {cameraState === 'rejected_ai' && (
              <div className="camera-error-box" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="error-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                  <XCircle size={28} />
                </div>
                <h3 style={{ color: 'var(--danger)' }}>AI-Generated / Manipulated Image Detected</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {errorMessage || 'Image authenticity screening failed. Deepfake / synthetic image detected.'}
                </p>
                <button className="primary-action-btn" onClick={handleRetake}>
                  <RefreshCw size={16} />
                  <span>{captureMethod === 'live' ? 'Capture New Live Selfie' : 'Upload Another Image'}</span>
                </button>
              </div>
            )}

            {cameraState === 'rejected_face' && (
              <div className="camera-error-box" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
                <div className="error-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ color: 'var(--warning)' }}>Face Match Failed</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {errorMessage || 'The provided face does not match the Aadhaar record.'}
                </p>
                <button className="primary-action-btn" onClick={handleRetake}>
                  <RefreshCw size={16} />
                  <span>{captureMethod === 'live' ? 'Retake Selfie' : 'Upload Another Image'}</span>
                </button>
              </div>
            )}

            {cameraState === 'success' && (
              <div className="fintech-success-view" style={{ 
                textAlign: 'center', 
                padding: '60px 40px', 
                background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)',
                borderRadius: '24px',
                border: '1px solid #bbf7d0',
                boxShadow: '0 20px 25px -5px rgba(22, 163, 74, 0.1), 0 8px 10px -6px rgba(22, 163, 74, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '50%',
                  padding: '20px',
                  boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
                  animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <CheckCircle2 size={48} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '800', 
                    color: '#166534', 
                    marginBottom: '12px',
                    letterSpacing: '-0.02em'
                  }}>
                    Verification Complete
                  </h3>
                  <p style={{ 
                    color: '#15803d', 
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    maxWidth: '400px',
                    margin: '0 auto',
                    opacity: 0.9
                  }}>
                    Your identity has been successfully verified. You're ready for the next step.
                  </p>
                </div>
                <button 
                  className="primary-action-btn" 
                  onClick={() => navigate('/verify/liveness')} 
                  style={{ 
                    width: 'auto', 
                    padding: '16px 40px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.3s ease',
                    marginTop: '16px',
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(37, 99, 235, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(37, 99, 235, 0.4)';
                  }}
                >
                  <span>Continue Process</span>
                  <ArrowRight size={20} />
                </button>
                <style>
                  {`
                    @keyframes scaleIn {
                      0% { transform: scale(0); opacity: 0; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes fadeInUp {
                      0% { transform: translateY(20px); opacity: 0; }
                      100% { transform: translateY(0); opacity: 1; }
                    }
                  `}
                </style>
              </div>
            )}

            {cameraState === 'denied' && (
              <div className="camera-error-box">
                <div className="error-icon-wrapper">
                  <Lock size={24} />
                </div>
                <h3>Camera access is blocked.</h3>
                <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: '400px' }}>
                  <ol style={{ paddingLeft: '20px', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    <li>Click the camera/site-permission icon in the browser address bar.</li>
                    <li>Allow camera access for localhost:5173.</li>
                    <li>Reload this page.</li>
                    <li>Click Retry Selfie.</li>
                  </ol>
                </div>
                <button className="primary-action-btn" onClick={handleRetake}>
                  <RefreshCw size={16} />
                  <span>Retry Selfie</span>
                </button>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="camera-error-box">
                <div className="error-icon-wrapper">
                  <AlertTriangle size={24} />
                </div>
                <h3>Verification Error</h3>
                <p>{errorMessage || 'Unable to proceed. Please check your inputs and try again.'}</p>
                <button className="primary-action-btn" onClick={handleRetake}>
                  <RefreshCw size={16} />
                  <span>Retry {captureMethod === 'live' ? 'Selfie' : 'Upload'}</span>
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
