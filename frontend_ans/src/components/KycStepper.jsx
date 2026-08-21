import React from 'react';
import { Check } from 'lucide-react';

const STEP_NAMES = [
  'Identity Verification',
  'PAN Verification',
  'Live Selfie Verification',
  'Final Review'
];

export default function KycStepper({ activeStepIndex = 0 }) {
  return (
    <div className="kyc-stepper-container">
      <div className="kyc-stepper-track">
        {STEP_NAMES.map((name, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          const isLast = idx === STEP_NAMES.length - 1;

          return (
            <React.Fragment key={idx}>
              <div className={`stepper-item ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}`}>
                <div className="stepper-circle">
                  {isCompleted ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="stepper-label">{name}</span>
              </div>
              {!isLast && (
                <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
