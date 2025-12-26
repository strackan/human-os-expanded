'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';

const mockUser = {
  name: 'Demo User',
  email: 'demo@example.com',
};

function SidebarDemoContent() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={mockUser} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* CSS Test Elements */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
          <div className="w-32 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
          <div className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-full shadow">CSS TEST</div>
        </div>
        
        <div className="mb-8">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-all"
          >
            {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          </button>
        </div>
        <div className="text-gray-700 text-lg">Sidebar Demo: Style and tweak the sidebar here in isolation.</div>
      </div>
    </div>
  );
}

export default function SidebarDemoPage() {
  return (
    <SidebarProvider>
      <SidebarDemoContent />
    </SidebarProvider>
  );
} 