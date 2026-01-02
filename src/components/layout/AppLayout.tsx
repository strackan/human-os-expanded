'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SunIcon, XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import UserAvatarDropdown from './UserAvatarDropdown';
import AuthButton from '@/components/auth/AuthButton';
import { WorkflowQueryService } from '@/lib/workflows/actions/WorkflowQueryService';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import QuickCapturePopover from '@/components/string-ties/QuickCapturePopover';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Get user data from auth context
  const { user } = useAuth();

  // Fetch workflow notifications (snoozed due + escalations)
  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoadingNotifications(false);
      return;
    }

    setLoadingNotifications(true);
    try {
      const queryService = new WorkflowQueryService();

      // Fetch snoozed workflows that are now due
      const snoozedResult = await queryService.getSnoozedWorkflowsDue(user.id);
      const snoozedWorkflows = snoozedResult.success && snoozedResult.workflows ? snoozedResult.workflows : [];

      // Fetch escalated workflows
      const escalatedResult = await queryService.getEscalatedToMe(user.id);
      const escalatedWorkflows = escalatedResult.success && escalatedResult.workflows ? escalatedResult.workflows : [];

      // Combine into notifications
      const allNotifications = [
        ...snoozedWorkflows.map(wf => ({
          id: `snoozed-${wf.id}`,
          title: `⏰ ${wf.workflow_name}`,
          message: `Snoozed workflow for ${wf.customer_name || 'Unknown Customer'} is now due`,
          metadata: {
            dueDate: 'Now',
            workflowId: wf.id,
            type: 'snoozed'
          }
        })),
        ...escalatedWorkflows.map(wf => ({
          id: `escalated-${wf.id}`,
          title: `🔺 ${wf.workflow_name}`,
          message: `Escalated from ${(wf as any).previous_owner || 'another CSM'} - ${wf.customer_name || 'Unknown Customer'}`,
          metadata: {
            dueDate: 'Urgent',
            workflowId: wf.id,
            type: 'escalated'
          }
        }))
      ];

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('[AppLayout] Error fetching workflow notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and every 2 minutes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [user?.id]);
  // Check if we're on a standalone page (no app chrome)
  const pathname = usePathname();
  const isStandalonePage = pathname?.startsWith('/sculptor');
  
  // For standalone pages, just render children without app layout
  if (isStandalonePage) {
    return <>{children}</>;
  }



  return (
    <div id="app-layout-container" className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isCollapsed} onToggle={setIsCollapsed} />
      <main
        id="main-content-area"
        data-sidebar-collapsed={isCollapsed}
        className="transition-all duration-300"
        role="main"
        aria-label="Main content"
      >
        {/* Header */}
        <header
          id="global-header"
          className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-gray-900/75"
          role="banner"
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 h-full">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Renubu Logo"
                  width={50}
                  height={57}
                  className="block"
                  priority
                />
              </Link>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-6">
              {/* String-Tie Quick Capture */}
              <QuickCapturePopover />

              {/* Check In - Coffee Mug Icon */}
              <button
                type="button"
                className="hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1 transition-all"
                aria-label="Check In"
                onClick={() => {
                  // TODO: Implement check-in functionality
                  console.log('Check In clicked');
                }}
              >
                <i className="fa-duotone fa-light fa-mug-hot text-lg" style={{ '--fa-primary-color': '#936c6c', '--fa-secondary-color': '#936c6c' } as React.CSSProperties}></i>
              </button>

              {/* Calendar Icon */}
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1 transition-colors"
                aria-label="Calendar"
              >
                <SunIcon className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Bell Icon with badge and popover */}
              <Popover onOpenChange={(open) => { if (open) fetchNotifications(); }}>
                <PopoverTrigger asChild>
                  <button
                    id="reminder-button"
                    type="button"
                    className="relative text-gray-400 hover:text-purple-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1"
                    aria-label="Notifications"
                    tabIndex={0}
                  >
                    <BookmarkIcon className="h-5 w-5" aria-hidden="true" />
                    {/* Alert badge - only show if count > 0 */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full border-2 border-white shadow">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 z-50 bg-white dark:bg-gray-800" align="end">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {loadingNotifications ? 'Loading...' : 'Recent updates and reminders'}
                    </p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer transition-colors"
                          onClick={() => {
                            // TODO: Launch workflow in Task Mode or inline widget
                            console.log('[AppLayout] Notification clicked:', notification.metadata?.workflowId);
                            // Placeholder for future workflow launch logic:
                            // Option 1: Navigate to /dashboard and trigger workflow launch
                            // Option 2: Open inline workflow widget/modal
                            // Option 3: Navigate directly to TaskMode with workflow ID
                            alert(`TODO: Launch workflow ${notification.metadata?.workflowId}\nType: ${notification.metadata?.type}`);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                            </div>
                            {notification.metadata?.dueDate && (
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                                {notification.metadata.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                      Add New Reminder
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <ThemeToggle />
              {user ? <UserAvatarDropdown /> : <AuthButton />}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-30 transition-opacity"
              onClick={() => setIsModalOpen(false)}
              aria-hidden="true"
            />
            
            {/* Modal panel */}
            <div className="relative z-50 w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 p-8 shadow-xl">
              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close modal"
                  tabIndex={0}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4">
                <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Attention Required
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  You have 7 items that need your attention. Would you like to review them now?
                </p>
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="rounded-lg bg-gray-100 dark:bg-gray-700 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setIsModalOpen(false)}
                    tabIndex={0}
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setIsModalOpen(false)}
                    tabIndex={0}
                  >
                    Review Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}