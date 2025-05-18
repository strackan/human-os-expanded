"use client";

import React from "react";
import { ChatProvider } from "../../context/ChatContext";
import GlobalChat from "../GlobalChat";
import AppLayout from "./AppLayout";
import { PageTransitionProvider } from "./PageTransitionContext";

interface ClientSideProps {
  children: React.ReactNode;
}

export default function ClientSide({ children }: ClientSideProps) {
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