import React from 'react';
import { ShieldCheck, HelpCircle, CheckCircle2, ArrowUpRight } from 'lucide-react';

export default function RightInfoPanel() {
  return (
    <aside className="right-info-panel">
      {/* Card 1: Why Verification */}
      <div className="info-card">
        <div className="info-card-header">
          <ShieldCheck size={16} className="info-header-icon blue" />
          <h3>Why verification?</h3>
        </div>
        <ul className="info-list">
          <li>
            <CheckCircle2 size={14} className="check-icon" />
            <span>Secure your account</span>
          </li>
          <li>
            <CheckCircle2 size={14} className="check-icon" />
            <span>Increase transaction limits</span>
          </li>
          <li>
            <CheckCircle2 size={14} className="check-icon" />
            <span>Prevent fraud & identity theft</span>
          </li>
          <li>
            <CheckCircle2 size={14} className="check-icon" />
            <span>Complete required verification</span>
          </li>
        </ul>
      </div>

      {/* Card 2: Need Help */}
      <div className="info-card">
        <div className="info-card-header">
          <HelpCircle size={16} className="info-header-icon blue" />
          <h3>Need Help?</h3>
        </div>
        <p className="info-text">
          Our support team is here to help.
        </p>
        <button 
          type="button" 
          className="support-btn" 
          onClick={() => alert('Support team contacted. We will assist you shortly!')}
        >
          <span>Contact Support</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </aside>
  );
}
