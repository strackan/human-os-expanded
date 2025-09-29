import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'info' | 'danger' | 'pending';
  children: React.ReactNode;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className = '' }) => {
  const baseClasses = 'status-badge';
  
  const statusClasses = {
    success: 'status-badge-success',
    warning: 'status-badge-warning',
    info: 'status-badge-info',
    danger: 'status-badge-danger',
    pending: 'bg-gray-100 text-gray-700'
  };
  
  return (
    <span className={cn(baseClasses, statusClasses[status], className)}>
      {children}
    </span>
  );
};

export default StatusBadge; 