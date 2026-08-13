import React from 'react';
import { Check, Lock, Clock, ArrowRight } from 'lucide-react';

export default function StepItem({ 
  step, 
  index, 
  totalSteps, 
  activeStepIndex, 
  onContinueStep 
}) {
  const { id, title, desc, estimatedTime, icon: Icon } = step;

  const isCompleted = index < activeStepIndex;
  const isActive = index === activeStepIndex;
  const isLocked = index > activeStepIndex;
  const isLast = index === totalSteps - 1;

  let statusText = 'Locked';
  let statusClass = 'locked';

  if (isCompleted) {
    statusText = 'Completed';
    statusClass = 'completed';
  } else if (isActive) {
    statusText = 'In Progress';
    statusClass = 'active';
  }

  return (
    <div className="step-item-container">
      {/* Indicator Column */}
      <div className="step-indicator-col">
        <div className={`step-circle ${statusClass}`}>
          {isCompleted ? (
            <Check size={20} />
          ) : isLocked ? (
            <Lock size={16} />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {!isLast && (
          <div className={`connector-line ${isCompleted ? 'completed' : isActive ? 'active-to-next' : ''}`}></div>
        )}
      </div>

      {/* Content Card */}
      <div className={`step-content-card ${statusClass}`}>
        <div className="card-header-row">
          <div className="step-title-group">
            <div className={`step-icon-frame ${statusClass}`}>
              <Icon size={20} />
            </div>
            <h3 className="step-title-text">{title}</h3>
          </div>
          <span className={`step-status-tag ${statusClass}`}>
            {statusText}
          </span>
        </div>

        {/* Expanded Body for Active Step */}
        {isActive && (
          <div className="card-expanded-body">
            <p className="step-desc-text">{desc}</p>

            {estimatedTime && (
              <div className="step-meta-row">
                <Clock size={14} />
                <span>{estimatedTime}</span>
              </div>
            )}

            <button 
              className="step-continue-btn"
              onClick={() => onContinueStep(id, index)}
              type="button"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
