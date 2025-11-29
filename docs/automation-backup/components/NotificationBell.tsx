/**
 * NotificationBell Component
 *
 * Header notification icon with:
 * - LinkedIn-style red badge showing unread count
 * - Dropdown panel with grouped notifications
 * - Mark as read / mark all as read actions
 * - Real-time polling via useNotifications hook
 * - Priority highlighting for urgent notifications
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification, NotificationGroup } from '../hooks/useNotifications';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationClick,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    groups,
    isLoading,
    lastFetched,
    markAsRead,
    markAllRead,
    deleteNotification,
    hasUnreadUrgent
  } = useNotifications({
    onNewNotification: (notification) => {
      // Could add toast notification here in future
      console.log('New notification:', notification);
    }
  });

  /**
   * Close panel when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Handle notification click
   */
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  /**
   * Handle delete notification
   */
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  /**
   * Render individual notification
   */
  const renderNotification = (notification: Notification) => {
    const priorityColor = notification.priority <= 2 ? 'urgent' : 'normal';

    return (
      <div
        key={notification.id}
        className={`notification-item ${!notification.read ? 'notification-unread' : ''} notification-${priorityColor}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="notification-content">
          <div className="notification-header">
            <h4 className="notification-title">{notification.title}</h4>
            <button
              className="notification-delete"
              onClick={(e) => handleDeleteNotification(notification.id, e)}
              aria-label="Delete notification"
            >
              ✕
            </button>
          </div>
          <p className="notification-message">{notification.message}</p>
          <div className="notification-footer">
            <span className="notification-time">
              {formatTimestamp(notification.createdAt)}
            </span>
            {!notification.read && <span className="notification-unread-dot">●</span>}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render notification group
   */
  const renderGroup = (group: NotificationGroup) => {
    return (
      <div key={group.type} className="notification-group">
        <div
          className="notification-group-header"
          onClick={() => setSelectedGroup(selectedGroup === group.type ? null : group.type)}
        >
          <span className="group-icon">{group.icon}</span>
          <span className="group-label">{group.label}</span>
          <span className="group-count">
            {group.notifications.length}
            {group.unreadCount > 0 && ` (${group.unreadCount} new)`}
          </span>
          <span className="expand-icon">
            {selectedGroup === group.type ? '▼' : '▶'}
          </span>
        </div>

        {selectedGroup === group.type && (
          <div className="notification-group-content">
            {group.notifications.map(renderNotification)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`notification-bell-container ${className}`} ref={panelRef}>
      {/* Bell Icon */}
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className={`notification-badge ${hasUnreadUrgent() ? 'notification-badge-urgent' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel">
          {/* Panel Header */}
          <div className="notification-panel-header">
            <div className="panel-title">
              <h3>Notifications</h3>
              {lastFetched && (
                <span className="last-updated">
                  Updated {formatTimestamp(lastFetched)}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="mark-all-read-btn"
                aria-label="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Panel Content */}
          <div className="notification-panel-content">
            {isLoading && notifications.length === 0 ? (
              <div className="notification-loading">
                <span className="loading-spinner">⏳</span>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">✅</span>
                <h4 className="empty-title">All caught up!</h4>
                <p className="empty-description">
                  You have no notifications at this time.
                </p>
              </div>
            ) : (
              <>
                {/* Ungrouped view for quick scan */}
                {selectedGroup === null && (
                  <div className="notification-list">
                    {notifications.slice(0, 10).map(renderNotification)}
                    {notifications.length > 10 && (
                      <div className="notification-view-all">
                        <p>Showing 10 of {notifications.length} notifications</p>
                        <p className="view-all-hint">
                          Click group headers below to see all
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Grouped view */}
                <div className="notification-groups">
                  {groups.map(renderGroup)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .notification-bell-container {
          position: relative;
          display: inline-block;
        }

        .notification-bell-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .notification-bell-button:hover {
          background: #f3f4f6;
        }

        .bell-icon {
          font-size: 24px;
          display: block;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #dc2626;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
          line-height: 1.2;
        }

        .notification-badge-urgent {
          animation: pulse-badge 2s infinite;
        }

        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
          }
        }

        .notification-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 420px;
          max-height: 600px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          z-index: 9999;
        }

        .notification-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .panel-title h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .last-updated {
          font-size: 12px;
          color: #9ca3af;
        }

        .mark-all-read-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .mark-all-read-btn:hover {
          background: #eff6ff;
        }

        .notification-panel-content {
          max-height: 520px;
          overflow-y: auto;
        }

        .notification-loading,
        .notification-empty {
          text-align: center;
          padding: 48px 24px;
          color: #6b7280;
        }

        .loading-spinner,
        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          margin: 0;
        }

        .notification-list {
          padding: 8px;
        }

        .notification-item {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-item:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .notification-item:last-child {
          margin-bottom: 0;
        }

        .notification-unread {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .notification-urgent {
          border-left: 4px solid #dc2626;
        }

        .notification-content {
          position: relative;
        }

        .notification-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          flex: 1;
        }

        .notification-delete {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          line-height: 1;
          transition: color 0.2s;
        }

        .notification-delete:hover {
          color: #ef4444;
        }

        .notification-message {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .notification-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .notification-unread-dot {
          color: #3b82f6;
          font-size: 8px;
        }

        .notification-view-all {
          text-align: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          margin-top: 8px;
        }

        .notification-view-all p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .view-all-hint {
          margin-top: 4px !important;
          font-size: 12px !important;
          color: #9ca3af !important;
        }

        .notification-groups {
          padding: 8px;
        }

        .notification-group {
          margin-bottom: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .notification-group:last-child {
          margin-bottom: 0;
        }

        .notification-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-group-header:hover {
          background: #f3f4f6;
        }

        .group-icon {
          font-size: 16px;
        }

        .group-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          flex: 1;
        }

        .group-count {
          font-size: 12px;
          color: #6b7280;
        }

        .expand-icon {
          font-size: 10px;
          color: #9ca3af;
        }

        .notification-group-content {
          padding: 8px;
          background: white;
        }
      `}</style>
    </div>
  );
};

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default NotificationBell;
