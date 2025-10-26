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
  TvIcon,
  UserGroupIcon,
  PhotoIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

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

const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    description: 'Welcome page'
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: UserGroupIcon,
    description: 'Customer list'
  },
  {
    name: 'Insights',
    href: '/insights',
    icon: LightBulbIcon,
    description: 'Analytics and business insights'
  },
  {
    name: 'Scenarios',
    href: '/scenarios',
    icon: MagnifyingGlassCircleIcon,
    description: 'Create and analyze different scenarios'
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: DocumentDuplicateIcon,
    description: 'Manage customer contracts'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: ChartBarIcon,
    description: 'View and generate reports'
  },
  {
    name: 'Demo',
    href: '/demo',
    icon: TvIcon,
    description: 'Demo and examples'
  },
  {
    name: 'Artifacts Gallery',
    href: '/artifacts/gallery',
    icon: PhotoIcon,
    description: 'Browse artifacts in gallery view'
  },
  {
    name: 'Artifacts Library',
    href: '/artifacts',
    icon: CubeIcon,
    description: 'Complete artifacts library with configs'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'Application settings'
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
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          {/* Logo/Brand */}
          <div className="sidebar-logo-container mb-8 flex items-center justify-between">
            <div className={`overflow-hidden transition-all duration-300 ${
              isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
            }`}>
              <Link
                href="/"
                className="whitespace-nowrap hover:text-blue-200 transition-colors flex items-center"
                aria-label="Renubu home"
              >
                <Image
                  src="/logo.png"
                  alt="Renubu Logo"
                  width={60}
                  height={68}
                  className="block my-2"
                  priority
                />
              </Link>
            </div>
            <button
              id="sidebar-toggle"
              onClick={() => onToggle(!isCollapsed)}
              className="rounded-lg p-2 text-gray-400 hover:bg-[#3D3A63] hover:text-white focus:outline-none transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
              tabIndex={0}
            >
              <ChevronRightIcon
                className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Navigation Items */}
          <nav id="sidebar-nav" className="space-y-1">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => {
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
        </div>

        {/* Settings Button */}
        <div>
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