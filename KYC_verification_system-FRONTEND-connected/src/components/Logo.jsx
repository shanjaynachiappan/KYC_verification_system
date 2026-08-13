import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logo({ size = 'medium' }) {
  const navigate = useNavigate();

  return (
    <div 
      className={`brand-logo brand-logo-${size}`}
      onClick={() => navigate('/')}
      title="VP Identity Platform"
      style={{ cursor: 'pointer' }}
    >
      <span>VP</span>
    </div>
  );
}
