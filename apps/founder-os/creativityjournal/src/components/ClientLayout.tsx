'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { EntryProvider, useEntry } from './EntryContext';

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ClientLayoutContent({ children }: ClientLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, rightSidebarWidth, isModalExpanded } = useSidebar();
  
  // Only use EntryContext on entry pages
  const isEntryPage = pathname.startsWith('/entry/') || pathname === '/entry';
  let writingMode = false;
  
  try {
    const entryContext = useEntry();
    writingMode = entryContext.writingMode;
  } catch (error) {
    // EntryContext not available on non-entry pages
    writingMode = false;
  }

  // Don't show header and sidebar on login page
  const showHeader = pathname !== '/';
  const showSidebar = pathname !== '/';

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-core-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we're not on the sign-in page and no user, redirect to sign-in
  // Only redirect when session has finished loading (status !== 'loading')
  if (pathname !== '/' && status === 'unauthenticated') {
    router.push('/');
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-core-green mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  const user = session?.user ? {
    id: session.user.id as string,
    name: session.user.name || undefined,
    email: session.user.email || undefined,
    image: session.user.image || undefined,
  } : null;

  return (
    <div className="min-h-screen bg-main-bg">
      {/* Sidebar */}
      {showSidebar && user && <Sidebar user={user} />}
      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          showSidebar ? (isCollapsed ? 'ml-20' : 'ml-64') : ''
        }`}
        style={{
          marginRight: isEntryPage && !writingMode 
            ? `${rightSidebarWidth + (isModalExpanded ? 300 : 0)}px` 
            : '0'
        }}
      >
        {showHeader && user && <Header user={user} />}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SidebarProvider>
      <EntryProvider>
        <ClientLayoutContent>
          {children}
        </ClientLayoutContent>
      </EntryProvider>
    </SidebarProvider>
  );
}