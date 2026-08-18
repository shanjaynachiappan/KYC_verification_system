import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, CheckCircle2, 
  Camera, CreditCard, ArrowRight, ShieldCheck
} from 'lucide-react';
import Header from '../components/Header';
import SidebarNav from '../components/SidebarNav';
import RightInfoPanel from '../components/RightInfoPanel';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cards] = useState([
    {
      id: 'aadhaar',
      title: 'Identity Verification',
      desc: 'Instant DigiLocker biometric verification completed',
      status: 'completed',
      icon: CreditCard,
      actionText: 'View Details'
    },
    {
      id: 'pan',
      title: 'PAN Verification',
      desc: 'NSDL PAN database record verified & matched',
      status: 'completed',
      icon: FileCheck,
      actionText: 'View Details'
    },
    {
      id: 'selfie',
      title: 'Selfie & Liveness',
      desc: 'AI biometric face match & liveness scan passed',
      status: 'completed',
      icon: Camera,
      actionText: 'View Details'
    },
    {
      id: 'final',
      title: 'Final Review',
      desc: 'Account compliance activated with full access limits',
      status: 'completed',
      icon: CheckCircle2,
      actionText: 'View Details'
    }
  ]);

  const usernameDisplay = user?.username ? user.username : 'Shanjay';
  const completedCount = cards.filter(c => c.status === 'completed').length;
  const progressPercent = Math.round((completedCount / cards.length) * 100);

  const handleCardClick = () => {
    navigate('/verification-workflow');
  };

  return (
    <div className="fintech-layout">
      <Header />

      <div className="fintech-dashboard-grid">
        <SidebarNav />

        <main className="fintech-main-content">
          {/* Welcome Banner */}
          <div className="fintech-welcome-hero">
            <div className="hero-top-bar">
              <div>
                <h1 className="hero-greeting">Welcome back, {usernameDisplay}</h1>
                <p className="hero-subtitle">Your identity verification is complete.</p>
              </div>

              <div className="verified-status-pill">
                <ShieldCheck size={16} />
                <span>VERIFIED</span>
              </div>
            </div>

            {/* Overall Progress Row */}
            <div className="hero-progress-box">
              <div className="progress-label-row">
                <span>Progress: {completedCount} of {cards.length} completed</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill green-fill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="dashboard-cards-grid">
            {cards.map(card => {
              const IconComponent = card.icon;
              return (
                <div className="dash-card" key={card.id}>
                  <div className="dash-card-header">
                    <div className="dash-icon-box">
                      <IconComponent size={20} />
                    </div>
                    <span className="dash-status-tag">Verified</span>
                  </div>

                  <h3 className="dash-card-title">{card.title}</h3>
                  <p className="dash-card-desc">{card.desc}</p>

                  <button 
                    className="dash-action-btn"
                    onClick={handleCardClick}
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </main>

        <RightInfoPanel />
      </div>
    </div>
  );
}
