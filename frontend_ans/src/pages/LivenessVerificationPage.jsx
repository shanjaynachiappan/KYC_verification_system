import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, RefreshCw, CheckCircle2, ArrowRight, UserCircle, XCircle } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import KycStepper from '../components/KycStepper';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import axios from 'axios';
import '../styles/liveness.css';

// Configuration
const CONFIG = {
  LEFT_YAW_THRESHOLD: 15,
  RIGHT_YAW_THRESHOLD: -15,
  MIN_CONFIRMATION_FRAMES: 3,
};

export default function LivenessVerificationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId, totalScore, selfieVerified } = useVerification();
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const requestRef = useRef(null);
  
  const [cameraState, setCameraState] = useState('initializing'); // initializing, ready, error, denied, in_use, no_camera, verifying, success
  const [errorMessage, setErrorMessage] = useState('');
  
  const [challengeState, setChallengeState] = useState('LOOK_STRAIGHT'); // LOOK_STRAIGHT, TURN_LEFT, TURN_RIGHT, VERIFYING, SUCCESS, FAILED
  const [faceStatus, setFaceStatus] = useState('no_face'); // no_face, multiple_faces, one_face
  const [consecutiveFrames, setConsecutiveFrames] = useState(0);
  
  const [livenessScore, setLivenessScore] = useState(null);

  useEffect(() => {
    initCameraAndMediaPipe();
    return () => {
      stopCamera();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  const initCameraAndMediaPipe = async () => {
    setCameraState('initializing');
    setErrorMessage('');
    setChallengeState('LOOK_STRAIGHT');
    setFaceStatus('no_face');
    setConsecutiveFrames(0);
    
    try {
      // 1. Init MediaPipe
      if (!faceLandmarkerRef.current) {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 2 // Allow multiple faces so we can detect if there are too many
        });
      }

      // 2. Init Camera
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setCameraState('ready');
      
    } catch (err) {
      console.error("Initialization error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
        setCameraState('denied');
      } else if (err.name === 'NotFoundError') {
        setCameraState('no_camera');
      } else if (err.name === 'NotReadableError') {
        setCameraState('in_use');
      } else {
        setErrorMessage(err.message || 'Unable to access the camera.');
        setCameraState('error');
      }
    }
  };

  const calculateYaw = (landmarks) => {
    // Simplified yaw calculation using specific landmarks
    // 33: left eye outer corner, 263: right eye outer corner, 1: nose tip
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];

    if (!leftEye || !rightEye || !nose) return 0;

    // Projection of nose relative to eyes on x axis
    const eyeDist = rightEye.x - leftEye.x;
    if (eyeDist === 0) return 0;
    
    const noseOffset = nose.x - leftEye.x;
    const ratio = noseOffset / eyeDist; // roughly 0.5 when looking straight
    
    // Convert to a roughly estimated angle
    const angle = (ratio - 0.5) * 100;
    return angle; // positive means turning left (nose goes right on screen), negative means turning right
  };

  const consecutiveFramesRef = useRef(0);

  const processFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || !faceLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }
    
    if (challengeState === 'VERIFYING' || challengeState === 'SUCCESS' || challengeState === 'FAILED') {
      return;
    }

    try {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.faceLandmarks) {
        if (results.faceLandmarks.length === 0) {
          setFaceStatus('no_face');
          consecutiveFramesRef.current = 0;
        } else if (results.faceLandmarks.length > 1) {
          setFaceStatus('multiple_faces');
          consecutiveFramesRef.current = 0;
        } else {
          setFaceStatus('one_face');
          // Exactly one face - process logic
          const landmarks = results.faceLandmarks[0];
          const yaw = calculateYaw(landmarks);
          
          setChallengeState(prev => {
            let nextState = prev;
            
            if (prev === 'LOOK_STRAIGHT') {
              if (Math.abs(yaw) < 20) { // Relaxed threshold
                consecutiveFramesRef.current++;
                if (consecutiveFramesRef.current >= CONFIG.MIN_CONFIRMATION_FRAMES) {
                  nextState = 'TURN_LEFT';
                  consecutiveFramesRef.current = 0;
                }
              } else {
                consecutiveFramesRef.current = 0;
              }
            } else if (prev === 'TURN_LEFT') {
              if (yaw > CONFIG.LEFT_YAW_THRESHOLD) {
                consecutiveFramesRef.current++;
                if (consecutiveFramesRef.current >= CONFIG.MIN_CONFIRMATION_FRAMES) {
                  nextState = 'TURN_RIGHT';
                  consecutiveFramesRef.current = 0;
                }
              } else {
                consecutiveFramesRef.current = 0;
              }
            } else if (prev === 'TURN_RIGHT') {
              if (yaw < CONFIG.RIGHT_YAW_THRESHOLD) {
                consecutiveFramesRef.current++;
                if (consecutiveFramesRef.current >= CONFIG.MIN_CONFIRMATION_FRAMES) {
                  nextState = 'VERIFYING';
                  handleLivenessSuccess();
                  consecutiveFramesRef.current = 0;
                }
              } else {
                consecutiveFramesRef.current = 0;
              }
            }
            
            return nextState;
          });
        }
      }
    } catch (err) {
      console.error("Frame processing error:", err);
    }
    
    if (challengeState !== 'VERIFYING' && challengeState !== 'SUCCESS' && challengeState !== 'FAILED') {
      requestRef.current = requestAnimationFrame(processFrame);
    }
  };

  useEffect(() => {
    if (cameraState === 'ready') {
      requestRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraState]);

  const handleLivenessSuccess = async () => {
    try {
      stopCamera();
      const payload = {
        user_id: userId,
        left_movement: true,
        right_movement: true,
        sequence_valid: true
      };
      
      const response = await axios.post('http://127.0.0.1:8000/liveness/verify', payload);
      
      setLivenessScore(response.data.liveness_score);
      setChallengeState('SUCCESS');
      
      if (user?.username) {
        try {
          const savedIndex = sessionStorage.getItem(`kyc_workflow_step_${user.username}`);
          const currentIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
          if (currentIndex <= 3) {
            sessionStorage.setItem(`kyc_workflow_step_${user.username}`, '4');
          }
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error("Liveness backend error:", err);
      setChallengeState('FAILED');
      setErrorMessage("Backend validation failed. Please try again.");
    }
  };

  const handleRetry = () => {
    initCameraAndMediaPipe();
  };

  const renderFaceStatus = () => {
    if (faceStatus === 'no_face') {
      return (
        <div className="face-status-indicator not-detected">
          <UserCircle size={18} />
          <span>Face not detected. Please position your face inside the camera frame.</span>
        </div>
      );
    } else if (faceStatus === 'multiple_faces') {
      return (
        <div className="face-status-indicator multiple">
          <XCircle size={18} />
          <span>Please make sure only one person is visible.</span>
        </div>
      );
    } else {
      return (
        <div className="face-status-indicator detected">
          <CheckCircle2 size={18} />
          <span>Face detected</span>
        </div>
      );
    }
  };

  const getStepProgress = () => {
    if (challengeState === 'LOOK_STRAIGHT') return '0%';
    if (challengeState === 'TURN_LEFT') return '50%';
    if (challengeState === 'TURN_RIGHT' || challengeState === 'VERIFYING' || challengeState === 'SUCCESS') return '100%';
    return '0%';
  };

  return (
    <div className="fintech-layout">
      <Header />
      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          <KycStepper activeStepIndex={3} />

          <div className="page-header-section">
            <button 
              className="fintech-back-btn" 
              onClick={() => navigate('/verification-workflow')}
            >
              <ArrowLeft size={16} />
              <span>Back to Workflow</span>
            </button>
          </div>

          <div className="liveness-card-container">
            
            {cameraState === 'initializing' && (
              <div className="fintech-loading-box" style={{ margin: '40px 0' }}>
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">Preparing liveness verification...</h3>
              </div>
            )}

            {cameraState === 'denied' && (
              <div className="camera-error-box">
                <h3>Camera access is blocked.</h3>
                <p>Please allow camera access in your browser settings and try again.</p>
                <button className="primary-action-btn" onClick={handleRetry} style={{ margin: '0 auto' }}>
                  <RefreshCw size={16} /><span>Retry Camera</span>
                </button>
              </div>
            )}

            {cameraState === 'in_use' && (
              <div className="camera-error-box">
                <h3>Camera is currently being used by another application.</h3>
                <p>Please close Zoom, Teams, Google Meet, Camera, or other applications using your camera.</p>
                <button className="primary-action-btn" onClick={handleRetry} style={{ margin: '0 auto' }}>
                  <RefreshCw size={16} /><span>Retry Camera</span>
                </button>
              </div>
            )}

            {cameraState === 'no_camera' && (
              <div className="camera-error-box">
                <h3>No camera was detected.</h3>
                <p>Please connect or enable a camera and try again.</p>
                <button className="primary-action-btn" onClick={handleRetry} style={{ margin: '0 auto' }}>
                  <RefreshCw size={16} /><span>Retry Camera</span>
                </button>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="camera-error-box">
                <h3>Unable to access the camera.</h3>
                <p>Please try again.</p>
                <button className="primary-action-btn" onClick={handleRetry} style={{ margin: '0 auto' }}>
                  <RefreshCw size={16} /><span>Retry Camera</span>
                </button>
              </div>
            )}

            {cameraState === 'ready' && challengeState !== 'VERIFYING' && challengeState !== 'SUCCESS' && challengeState !== 'FAILED' && (
              <>
                <h3 className="liveness-title">LIVENESS VERIFICATION</h3>
                <p className="liveness-subtitle">Verify that you are a real person</p>

                <div className={`camera-preview-container ${faceStatus === 'one_face' ? 'active' : ''}`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />
                </div>

                {renderFaceStatus()}

                {challengeState === 'LOOK_STRAIGHT' && (
                  <div className="instruction-text">
                    <span style={{color: '#64748b', fontSize: '1rem', display: 'block', marginBottom: '8px'}}>Step 1 of 3</span>
                    Look straight at the camera
                  </div>
                )}
                {challengeState === 'TURN_LEFT' && (
                  <div className="instruction-text">
                    <span style={{color: '#64748b', fontSize: '1rem', display: 'block', marginBottom: '8px'}}>Step 2 of 3</span>
                    Slowly turn your head LEFT
                  </div>
                )}
                {challengeState === 'TURN_RIGHT' && (
                  <div className="instruction-text">
                    <span style={{color: '#64748b', fontSize: '1rem', display: 'block', marginBottom: '8px'}}>Step 3 of 3</span>
                    Slowly turn your head RIGHT
                  </div>
                )}

                <div className="step-indicator-container">
                  <div className="step-indicator-line"></div>
                  <div className="step-indicator-progress" style={{ width: getStepProgress() }}></div>
                  
                  <div className={`step-item ${challengeState === 'LOOK_STRAIGHT' ? 'active' : 'completed'}`}>
                    <div className="step-circle">
                      {challengeState !== 'LOOK_STRAIGHT' ? <CheckCircle2 size={16} color="white" /> : <div className="inner-dot"></div>}
                    </div>
                    <span className="step-label">Straight</span>
                  </div>
                  
                  <div className={`step-item ${challengeState === 'TURN_LEFT' ? 'active' : (challengeState === 'TURN_RIGHT' ? 'completed' : '')}`}>
                    <div className="step-circle">
                      {challengeState === 'TURN_RIGHT' ? <CheckCircle2 size={16} color="white" /> : (challengeState === 'TURN_LEFT' ? <div className="inner-dot"></div> : null)}
                    </div>
                    <span className="step-label">Left</span>
                  </div>
                  
                  <div className={`step-item ${challengeState === 'TURN_RIGHT' ? 'active' : ''}`}>
                    <div className="step-circle">
                      {challengeState === 'TURN_RIGHT' ? <div className="inner-dot"></div> : null}
                    </div>
                    <span className="step-label">Right</span>
                  </div>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '32px', textAlign: 'center' }}>
                  Keep your face inside the frame
                </p>
              </>
            )}

            {challengeState === 'VERIFYING' && (
              <div className="fintech-loading-box" style={{ margin: '40px 0' }}>
                <div className="fintech-spinner"></div>
                <h3 className="loading-title">Verifying Liveness...</h3>
                <p className="loading-desc">Please wait securely.</p>
              </div>
            )}
            
            {challengeState === 'FAILED' && (
              <div className="camera-error-box">
                <h3>Verification couldn't be completed</h3>
                <p>{errorMessage}</p>
                <button className="primary-action-btn" onClick={handleRetry} style={{ margin: '20px auto 0' }}>
                  <RefreshCw size={16} /><span>Try Again</span>
                </button>
              </div>
            )}

            {challengeState === 'SUCCESS' && (
              <div className="liveness-success-view">
                <div className="success-icon-container">
                  <CheckCircle2 size={64} color="white" />
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534', marginBottom: '16px' }}>
                  Liveness Verification Complete
                </h3>
                <p style={{ color: '#15803d', fontSize: '1.1rem', textAlign: 'center', marginBottom: '32px' }}>
                  Your identity verification step was successfully completed.
                </p>
                <button className="primary-action-btn" onClick={() => navigate('/verify/aml')} style={{ width: 'auto', padding: '16px 40px', fontSize: '1.1rem', borderRadius: '12px' }}>
                  <span>Continue to Compliance Screening</span>
                  <ArrowRight size={20} />
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
