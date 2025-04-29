'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassCircleIcon,
  DocumentDuplicateIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (value: boolean) => void;
}

const navigation: NavItem[] = [
  { name: 'Renewals HQ', href: '/', icon: HomeIcon },
  { name: 'Insights', href: '/insights', icon: LightBulbIcon },
  { name: 'Scenarios', href: '/scenarios', icon: MagnifyingGlassCircleIcon },
  { name: 'Contracts', href: '/contracts', icon: DocumentDuplicateIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`fixed left-0 top-0 h-screen bg-[#2D2A53] transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          {/* Logo/Brand */}
          <div className="mb-8 flex items-center justify-between">
            <div className={`overflow-hidden transition-all duration-300 ${
              isCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'
            }`}>
              <span className="text-xl font-bold text-white whitespace-nowrap">Renubu</span>
            </div>
            <button
              onClick={() => onToggle(!isCollapsed)}
              className="rounded-lg p-2 text-gray-400 hover:bg-[#3D3A63] hover:text-white"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex h-11 items-center rounded-lg px-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3D3A63] text-white'
                      : 'text-gray-300 hover:bg-[#3D3A63] hover:text-white'
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className={`absolute left-9 overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
                  }`}>
                    <span className="whitespace-nowrap px-2">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings Button */}
        <div>
          <Link
            href="/settings"
            className="group relative flex h-11 items-center rounded-lg px-2 text-sm font-medium text-gray-300 hover:bg-[#3D3A63] hover:text-white"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <Cog6ToothIcon className="h-5 w-5" />
            </div>
            <div className={`absolute left-9 overflow-hidden transition-all duration-300 ${
              isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'
            }`}>
              <span className="whitespace-nowrap px-2">Settings</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 