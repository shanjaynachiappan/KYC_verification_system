import React from 'react';
import { Check, Clock, ArrowRight, FileText } from 'lucide-react';

export default function StepItem({ 
  step, 
  index, 
  activeStepIndex, 
  onContinueStep 
}) {
  const { id, title, desc, estimatedTime, icon: Icon = FileText } = step;

  const isCompleted = index < activeStepIndex;
  const isActive = index === activeStepIndex;
  const isUpcoming = index > activeStepIndex;

  return (
    <div className={`fintech-step-card ${isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'}`}>
      <div className="card-top-row">
        <div className="card-title-group">
          <div className={`step-icon-wrapper ${isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'}`}>
            {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} />}
          </div>
          <div className="step-title-text-wrap">
            <h3 className="step-title">{title}</h3>
            {!isActive && <p className="step-short-desc">{desc}</p>}
          </div>
        </div>

        <span className={`step-badge ${isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'}`}>
          {isCompleted && 'Completed'}
          {isActive && 'In Progress'}
          {isUpcoming && 'Upcoming'}
        </span>
      </div>

      {isActive && (
        <div className="card-active-content">
          <p className="active-desc">{desc}</p>

          <div className="active-footer-row">
            {estimatedTime && (
              <div className="time-estimate">
                <Clock size={14} />
                <span>{estimatedTime}</span>
              </div>
            )}

            <button 
              className="continue-btn"
              onClick={() => onContinueStep(id, index)}
              type="button"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="card-completed-content">
          <span className="completed-check-label">
            <Check size={14} className="green-check" /> Verified successfully
          </span>
        </div>
      )}
    </div>
  );
}
