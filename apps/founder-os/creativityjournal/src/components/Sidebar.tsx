'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSidebar } from './SidebarContext';
import { useRole } from '@/hooks/useRole';
import { getRoleDisplayName, getRoleColor } from '@/lib/roles';

// Use Heroicons or similar for demo icons
const icons = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v7a2 2 0 002 2h2a2 2 0 002-2v-7m-6 0h6" /></svg>,
  entries: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  tasks: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  moods: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 15s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V4m0 16v-4m8-4h-4m-8 0H4" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>,
  search: <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
  admin: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  projects: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
};

interface SidebarProps {
  user: any;
}

const baseNavItems = [
  { name: 'Home', href: '/dashboard', icon: icons.home },
  { name: 'Entries', href: '/entries', icon: icons.entries },
  { name: 'Snippets', href: '/snippets', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
  { name: 'Tasks', href: '/tasks', icon: icons.tasks },
  { name: 'Projects', href: '/projects', icon: icons.projects },
  { name: 'Moods', href: '/moods', icon: icons.moods },
  { name: 'Settings', href: '/settings', icon: icons.settings },
];

const adminNavItems = [
  { name: 'Admin', href: '/admin/emotion-suggestions', icon: icons.admin },
];

export default function Sidebar({ user }: SidebarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  
  // Create dynamic navigation based on role
  const navItems = [
    ...baseNavItems,
    ...(role.canAccessAdmin() ? adminNavItems : []),
  ];

  const handleNewEntry = () => {
    router.push('/entry/new');
  };

  const getNewEntryButtonStyle = () => {
    const isActive = pathname === '/entry' || pathname === '/entry/new';
    const baseClasses = `flex items-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`;
    
    return `${baseClasses} ${isActive ? 'bg-green-500 text-white shadow-lg font-bold' : 'text-gray-700 hover:bg-gray-100/80 hover:text-green-700'}`;
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 bg-gray-50/95 backdrop-blur-sm flex flex-col border-r border-gray-200/50
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        aria-label="Sidebar"
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-8 w-6 h-6 rounded-full bg-white shadow-lg border border-gray-200/50 flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:shadow-xl z-[100]`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">Journal</span>
                <span className="text-xs text-gray-500">Creativity & Reflection</span>
              </div>
            )}
          </div>
        </div>

        {/* New Entry Button */}
        <div className="p-4 border-b border-gray-200/50">
          <button
            onClick={handleNewEntry}
            className={getNewEntryButtonStyle()}
            title="New Entry"
          >
            <span className="text-lg">✏️</span>
            {!isCollapsed && (
              <span className="font-medium">New Entry</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'bg-green-500 text-white shadow-lg font-bold'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:text-green-700'
                }`}
                title={item.name}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {user?.name || 'User'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(role.userRole)}`}>
                    {getRoleDisplayName(role.userRole)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className={`mt-3 w-full flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isCollapsed ? 'justify-center' : 'gap-3'
            } text-gray-700 hover:bg-red-100/80 hover:text-red-700`}
            title="Sign Out"
          >
            {icons.logout}
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
} 