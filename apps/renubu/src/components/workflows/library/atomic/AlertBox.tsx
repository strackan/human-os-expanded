import React from 'react';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';

export interface AlertBoxProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

/**
 * AlertBox - Atomic Component
 *
 * Displays contextual alerts, warnings, success messages, and errors.
 * Used throughout workflows for status updates, validation messages, and important notifications.
 *
 * @example
 * <AlertBox
 *   type="warning"
 *   title="Churn Risk Detected"
 *   message="Customer health score has dropped below 60. Immediate action recommended."
 *   actionLabel="View Details"
 *   onAction={() => navigate('/health')}
 *   dismissible
 * />
 */
export const AlertBox = React.memo(function AlertBox({
  type,
  title,
  message,
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
  icon
}: AlertBoxProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  // Type-based styling
  const typeConfig = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: <InformationCircleIcon className="w-5 h-5 text-blue-600" />,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-800',
      buttonColor: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-800',
      buttonColor: 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100'
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-800',
      buttonColor: 'text-green-700 hover:text-green-900 hover:bg-green-100'
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: <XCircleIcon className="w-5 h-5 text-red-600" />,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-800',
      buttonColor: 'text-red-700 hover:text-red-900 hover:bg-red-100'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`
        relative rounded-lg border p-4
        ${config.container}
        transition-all duration-200
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${config.titleColor}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${config.messageColor}`}>
            {message}
          </p>

          {/* Action Button */}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`
                mt-3 text-sm font-medium
                ${config.buttonColor}
                px-3 py-1.5 rounded-md
                transition-colors duration-150
              `}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 rounded-md
              ${config.iconColor} opacity-60 hover:opacity-100
              transition-opacity duration-150
            `}
            aria-label="Dismiss alert"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
});

AlertBox.displayName = 'AlertBox';

export default AlertBox;
