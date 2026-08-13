import React from 'react';

export default function Badge({ icon: Icon, label }) {
  return (
    <div className="badge-item">
      {Icon && <Icon size={14} className="badge-svg" />}
      <span>{label}</span>
    </div>
  );
}
