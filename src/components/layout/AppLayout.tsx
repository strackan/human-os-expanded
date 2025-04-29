'use client';

import { useState } from 'react';
import { UserCircleIcon, Cog6ToothIcon, MagnifyingGlassIcon, SunIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} onToggle={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, Justin
              </h1>
              <div className="flex items-center space-x-2" aria-label="Weather information">
                <SunIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                <span className="text-base font-medium text-gray-800">72°F</span>
                <span className="text-sm text-gray-500">Sunny</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <form className="relative" role="search" aria-label="Search">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input
                  type="search"
                  className="block w-48 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Search..."
                  aria-label="Search"
                  tabIndex={0}
                />
              </form>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <span className="sr-only">View settings</span>
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="flex items-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <span className="sr-only">View profile</span>
                <UserCircleIcon className="h-8 w-8" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-30 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal panel */}
            <div className="relative z-50 w-full max-w-3xl rounded-lg bg-white p-8 shadow-xl">
              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  <span className="sr-only">Close modal</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mt-4">
                <h2 className="text-2xl font-semibold text-gray-900">Attention Required</h2>
                <p className="mt-4 text-lg text-gray-600">
                  You have 7 items that need your attention. Would you like to review them now?
                </p>
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="rounded-lg bg-gray-100 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-200"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
                    onClick={() => setIsModalOpen(false)}
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