import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, AlertCircle, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import { useVerification } from '../context/VerificationContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/dashboard.css'; // Reusing dashboard styles for consistency

export default function AMLProcessingPage() {
  const navigate = useNavigate();
  const { userId, aadhaarData } = useVerification();
  const { user } = useAuth();
  
  const [processingState, setProcessingState] = useState('started'); // started, processing, completed, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Stages: 'pending', 'active', 'completed'
  const [stages, setStages] = useState({
    identity: 'completed',
    face: 'completed',
    liveness: 'completed',
    sanctions: 'pending',
    pep: 'pending',
    adverseMedia: 'pending',
    sof: 'pending',
    finalizing: 'pending'
  });

  const processedRef = useRef(false);

  useEffect(() => {
    // Only run once
    if (processedRef.current) return;
    processedRef.current = true;

    runAMLChecks();
  }, []);

  const runAMLChecks = async () => {
    setProcessingState('processing');
    
    // Simulate progression for UI
    setStages(prev => ({ ...prev, sanctions: 'active' }));
    await new Promise(resolve => setTimeout(resolve, 800));
    setStages(prev => ({ ...prev, sanctions: 'completed', pep: 'active' }));
    await new Promise(resolve => setTimeout(resolve, 800));
    setStages(prev => ({ ...prev, pep: 'completed', adverseMedia: 'active' }));
    await new Promise(resolve => setTimeout(resolve, 800));
    setStages(prev => ({ ...prev, adverseMedia: 'completed', sof: 'active' }));
    
    try {
      const name = aadhaarData?.fullName || aadhaarData?.name || user?.username || 'Verified User';
      
      const payload = {
        user_id: userId,
        name: name,
        declared_income_band: "5-10L", // Demo default, would normally come from KYB/onboarding
        declared_source: "Salaried employment" // Demo default
      };

      const response = await axios.post('http://127.0.0.1:8000/aml/screen', payload);
      
      setStages(prev => ({ ...prev, sof: 'completed', finalizing: 'active' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStages(prev => ({ ...prev, finalizing: 'completed' }));
      setProcessingState('completed');
      
      // Auto redirect after short delay
      setTimeout(() => {
        navigate('/verify/review'); // Continue to next step in workflow
      }, 1500);

    } catch (error) {
      console.error("AML Processing Error:", error);
      setProcessingState('error');
      setErrorMessage("Compliance screening is temporarily unavailable.");
    }
  };

  const handleRetry = () => {
    setProcessingState('started');
    setErrorMessage('');
    setStages({
      identity: 'completed',
      face: 'completed',
      liveness: 'completed',
      sanctions: 'pending',
      pep: 'pending',
      adverseMedia: 'pending',
      sof: 'pending',
      finalizing: 'pending'
    });
    processedRef.current = false;
    runAMLChecks();
  };

  const renderStageIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 size={20} className="text-emerald-500" style={{ color: '#10b981' }} />;
    if (status === 'active') return <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>;
    return <Circle size={20} className="text-slate-300" style={{ color: '#cbd5e1' }} />;
  };

  return (
    <div className="fintech-layout">
      <Header />
      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-2xl" style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', padding: '2rem', width: '100%', maxWidth: '42rem' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>AML ENGINE PROCESSING</h1>
              <p style={{ color: '#64748b' }}>Running automated compliance screening...</p>
            </div>

            {processingState === 'error' ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center' }}>
                <AlertTriangle size={32} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#991b1b', fontWeight: '600', marginBottom: '0.5rem' }}>Processing Failed</h3>
                <p style={{ color: '#b91c1c', marginBottom: '1.5rem' }}>{errorMessage}</p>
                <button 
                  onClick={handleRetry}
                  style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  {renderStageIcon(stages.identity)}
                  <span style={{ color: stages.identity === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.identity === 'active' ? '600' : '400' }}>Identity verification</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  {renderStageIcon(stages.face)}
                  <span style={{ color: stages.face === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.face === 'active' ? '600' : '400' }}>Face verification</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  {renderStageIcon(stages.liveness)}
                  <span style={{ color: stages.liveness === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.liveness === 'active' ? '600' : '400' }}>Liveness verification</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '4px solid #10b981' }}>
                  {renderStageIcon(stages.sanctions)}
                  <span style={{ color: stages.sanctions === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.sanctions === 'active' ? '600' : '400' }}>Sanctions screening</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '4px solid #10b981' }}>
                  {renderStageIcon(stages.pep)}
                  <span style={{ color: stages.pep === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.pep === 'active' ? '600' : '400' }}>PEP screening</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '4px solid #10b981' }}>
                  {renderStageIcon(stages.adverseMedia)}
                  <span style={{ color: stages.adverseMedia === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.adverseMedia === 'active' ? '600' : '400' }}>Adverse media screening</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', borderLeft: '4px solid #10b981' }}>
                  {renderStageIcon(stages.sof)}
                  <span style={{ color: stages.sof === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.sof === 'active' ? '600' : '400' }}>Source of funds assessment</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                  {renderStageIcon(stages.finalizing)}
                  <span style={{ color: stages.finalizing === 'pending' ? '#94a3b8' : '#334155', fontWeight: stages.finalizing === 'active' ? '600' : '400' }}>Calculating compliance result</span>
                </div>
              </div>
            )}

            {processingState === 'completed' && (
              <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.5rem', color: '#065f46', fontWeight: '600' }}>
                AML screening completed ✓
              </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}} />
          </div>

        </main>
        
        <RightInfoPanel />
      </div>
    </div>
  );
}
