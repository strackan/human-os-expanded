'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  MagnifyingGlassCircleIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
  description?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (value: boolean) => void;
}

// Primary navigation (main features)
const primaryNavigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Main dashboard'
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: UserGroupIcon,
    description: 'Customer management'
  },
  {
    name: 'Renewals',
    href: '/renewals',
    icon: ClipboardDocumentCheckIcon,
    description: 'Renewal tracking'
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: DocumentDuplicateIcon,
    description: 'Contract management'
  }
];

// Secondary navigation (additional features - shown lower with transparency)
const secondaryNavigation: NavItem[] = [
  {
    name: 'Parking Lot',
    href: '/parking-lot',
    icon: RectangleStackIcon,
    description: 'Idea capture and parking lot'
  },
  {
    name: 'Tasks',
    href: '/tasks/do',
    icon: ClipboardDocumentCheckIcon,
    description: 'Task execution'
  },
  {
    name: 'Insights',
    href: '/insights',
    icon: LightBulbIcon,
    description: 'Analytics and insights'
  },
  {
    name: 'Scenarios',
    href: '/scenarios',
    icon: MagnifyingGlassCircleIcon,
    description: 'Scenario modeling'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    description: 'Reports and analytics'
  },
  {
    name: 'Revenue',
    href: '/revenue',
    icon: CurrencyDollarIcon,
    description: 'Revenue tracking'
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: BellAlertIcon,
    description: 'Alerts and notifications'
  },
  {
    name: 'Events',
    href: '/events',
    icon: CalendarDaysIcon,
    description: 'Event history'
  }
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="global-sidebar"
      data-collapsed={isCollapsed}
      className="fixed left-0 top-0 h-screen bg-[#2D2A53]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col p-4">
        {/* Toggle Button */}
        <div className="mb-6 flex justify-end">
          <button
            id="sidebar-toggle"
            onClick={() => onToggle(!isCollapsed)}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#3D3A63] hover:text-white focus:outline-none transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            tabIndex={0}
          >
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav id="primary-nav" className="space-y-1">
          <ul role="list" className="space-y-1">
            {primaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    id={`nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    href={item.href}
                    className={`group relative flex h-11 items-center rounded-lg px-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#2D2A53] ${
                      isActive
                        ? 'bg-[#3D3A63] text-white'
                        : 'text-gray-300 hover:bg-[#3D3A63] hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={0}
                    title={item.description}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className={`absolute left-9 overflow-hidden transition-all duration-300 ${
                      isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
                    }`}>
                      <span className="whitespace-nowrap px-2">{item.name}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Spacer to push secondary nav down */}
        <div className="flex-grow" />

        {/* Divider */}
        <div className={`border-t border-gray-600 my-4 transition-all duration-300 ${
          isCollapsed ? 'mx-2' : 'mx-0'
        }`} />

        {/* Secondary Navigation (lower, slightly transparent) */}
        <nav id="secondary-nav" className="space-y-1 opacity-70">
          <ul role="list" className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    id={`nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    href={item.href}
                    className={`group relative flex h-10 items-center rounded-lg px-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#2D2A53] ${
                      isActive
                        ? 'bg-[#3D3A63] text-white opacity-100'
                        : 'text-gray-400 hover:bg-[#3D3A63] hover:text-white hover:opacity-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    tabIndex={0}
                    title={item.description}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className={`absolute left-9 overflow-hidden transition-all duration-300 ${
                      isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
                    }`}>
                      <span className="whitespace-nowrap px-2 text-xs">{item.name}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings at bottom */}
        <div className="mt-4">
          <Link
            href="/settings"
            className="group relative flex h-11 items-center rounded-lg px-2 text-sm font-medium text-gray-300 hover:bg-[#3D3A63] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#2D2A53] transition-colors"
            aria-label="Settings"
            tabIndex={0}
            title="Application settings"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className={`absolute left-9 overflow-hidden transition-all duration-300 ${
              isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
            }`}>
              <span className="whitespace-nowrap px-2">Settings</span>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
} 