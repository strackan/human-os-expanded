import React from 'react';

interface StatProps {
  label: string;
  value: string;
  className?: string;
}

const Stat: React.FC<StatProps> = ({ label, value, className = '' }) => (
  <div className={`stat-card ${className}`}>
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

export default Stat; 