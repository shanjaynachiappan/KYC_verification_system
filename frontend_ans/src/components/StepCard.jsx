import React from 'react';
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function StepCard({ step, onClick }) {
  const { id, title, desc, status, icon: Icon, actionText } = step;

  const renderStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <span className="step-badge completed">
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="step-badge active">
            <Clock size={12} />
            <span>In Progress</span>
          </span>
        );
      case 'failed':
        return (
          <span className="step-badge failed">
            <AlertTriangle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="step-badge upcoming">
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className={`fintech-step-card ${status === 'completed' ? 'completed' : status === 'in-progress' ? 'active' : 'upcoming'}`} onClick={() => onClick(id)} style={{ cursor: 'pointer' }}>
      <div className="card-top-row">
        <div className="card-title-group">
          <div className={`step-icon-wrapper ${status === 'completed' ? 'completed' : status === 'in-progress' ? 'active' : 'upcoming'}`}>
            <Icon size={18} />
          </div>
          <div>
            <h3 className="step-title">{title}</h3>
            <p className="step-short-desc">{desc}</p>
          </div>
        </div>

        {renderStatusBadge()}
      </div>

      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="continue-btn"
          type="button"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          <span>{actionText}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
