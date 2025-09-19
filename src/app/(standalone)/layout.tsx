import React from 'react';

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-100 z-50">
      {children}
    </div>
  );
}