import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, FileCheck, CheckCircle2, 
  Camera, CreditCard, ArrowRight 
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState([
    {
      id: 'aadhaar',
      title: 'Aadhaar Verification',
      desc: 'Instant UIDAI biometric verification via OTP',
      status: 'completed',
      icon: CreditCard,
      actionText: 'View Details'
    },
    {
      id: 'pan',
      title: 'PAN Verification',
      desc: 'NSDL PAN database verification and name match',
      status: 'completed',
      icon: FileCheck,
      actionText: 'View Details'
    },
    {
      id: 'selfie',
      title: 'Selfie & Liveness Check',
      desc: 'AI-assisted face matching & 3D liveness detection',
      status: 'completed',
      icon: Camera,
      actionText: 'View Details'
    },
    {
      id: 'final',
      title: 'Final KYC Status',
      desc: 'Automated compliance score and video KYC review',
      status: 'completed',
      icon: CheckCircle2,
      actionText: 'Verified'
    }
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCardClick = (id) => {
    setCards(prev => prev.map(c => {
      if (c.id === id && c.status === 'in-progress') {
        return { ...c, status: 'completed', actionText: 'View Details' };
      }
      if (c.id === id && c.status === 'pending') {
        return { ...c, status: 'in-progress', actionText: 'Continue' };
      }
      return c;
    }));
  };

  const completedCount = cards.filter(c => c.status === 'completed').length;
  const progressPercent = Math.round((completedCount / cards.length) * 100);

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <Logo size="small" />
          <div className="nav-title-group">
            <span className="nav-brand-title">VP Identity</span>
            <span className="nav-subtitle">KYC Portal</span>
          </div>
        </div>

        <div className="nav-right">
          <div className="user-badge">
            <span>User:</span>
            <strong>{user?.username || 'Member'}</strong>
          </div>
          <ThemeToggle />
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Welcome Hero */}
        <section className="welcome-hero">
          <div className="welcome-title-row">
            <h1 className="welcome-user-text">
              Welcome back, <span className="username-highlight">{user?.username}</span>!
            </h1>
          </div>

          <p className="welcome-desc">
            Your verification steps are completed. Your VerifyPay account is active with higher transaction limits.
          </p>

          {/* Progress Bar */}
          <div className="progress-card">
            <div className="progress-header">
              <span>Overall Status</span>
              <span>{completedCount} of {cards.length} Verified ({progressPercent}%)</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Verification Cards Grid */}
        <section className="cards-grid">
          {cards.map(card => {
            const IconComponent = card.icon;
            return (
              <div className="kyc-card" key={card.id}>
                <div className="card-top">
                  <div className={`card-icon-frame ${card.status}`}>
                    <IconComponent size={22} />
                  </div>
                  <span className={`status-badge ${card.status}`}>
                    {card.status === 'completed' && 'Verified'}
                    {card.status === 'in-progress' && 'In Progress'}
                    {card.status === 'pending' && 'Pending'}
                  </span>
                </div>

                <h3 className="card-title">{card.title}</h3>
                <p className="card-desc">{card.desc}</p>

                <button 
                  className={`card-action-btn ${card.status === 'in-progress' ? 'primary' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <span>{card.actionText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
