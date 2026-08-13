import React from 'react';
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function StepCard({ step, onClick }) {
  const { id, title, desc, status, icon: Icon, actionText } = step;

  const renderStatusBadge = () => {
    switch (status) {
      case 'completed':
        return (
          <span className="status-pill completed">
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </span>
        );
      case 'in-progress':
        return (
          <span className="status-pill in-progress">
            <Clock size={12} />
            <span>In Progress</span>
          </span>
        );
      case 'failed':
        return (
          <span className="status-pill failed">
            <AlertTriangle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="status-pill pending">
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="step-card" onClick={() => onClick(id)}>
      <div className="step-card-header">
        <div className={`step-icon-box ${status}`}>
          <Icon size={24} />
        </div>
        {renderStatusBadge()}
      </div>

      <div className="step-content">
        <h3 className="step-title">{title}</h3>
        <p className="step-desc">{desc}</p>
      </div>

      <button 
        className={`step-action-btn ${status === 'completed' ? 'completed-btn' : 'active-btn'}`}
        type="button"
      >
        <span>{actionText}</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
