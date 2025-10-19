'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  icon?: 'clock' | 'check' | 'alert' | 'none';
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  message,
  type = 'info',
  icon = 'none',
  duration = 3000,
  onClose
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    if (icon === 'clock') return <Clock className="w-5 h-5 text-blue-500" />;
    if (icon === 'check') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (icon === 'alert') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return null;
  };

  const getBgColor = () => {
    if (type === 'success') return 'bg-green-50 border-green-200';
    if (type === 'error') return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  };

  const getTextColor = () => {
    if (type === 'success') return 'text-green-800';
    if (type === 'error') return 'text-red-800';
    return 'text-gray-800';
  };

  return (
    <div
      className={`
        ${getBgColor()} ${getTextColor()}
        rounded-lg border shadow-lg p-4
        flex items-center gap-3
        animate-slide-in-right
        min-w-[300px] max-w-[500px]
      `}
      role="alert"
    >
      {icon !== 'none' && getIcon()}

      <p className="flex-1 text-sm font-medium">{message}</p>

      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
