"use client";

import React from "react";
import { ChatProvider } from "../../context/ChatContext";
import GlobalChat from "../GlobalChat";
import AppLayout from "./AppLayout";
import { PageTransitionProvider } from "./PageTransitionContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ClientLayout({ children }: ClientLayoutProps) {
  // This is a client component that wraps all client-side providers
  return (
    <ChatProvider>
      <PageTransitionProvider>
        <AppLayout>
          {children}
          <GlobalChat />
        </AppLayout>
      </PageTransitionProvider>
    </ChatProvider>
  );
}

export default ClientLayout; 