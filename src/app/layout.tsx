import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { DateProvider } from "@/context/DateContext";
import GlobalChat from "@/components/GlobalChat";
import AppLayout from "@/components/layout/AppLayout";
import { PageTransitionProvider } from "../components/layout/PageTransitionContext";
// import AuthProviderWrapper from "@/components/auth/AuthProviderWrapper";
import AuthProvider from "@/components/auth/AuthProvider";
import RouteGuard from "@/components/auth/RouteGuard";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Renubu",
  description: "Contract Management Platform",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://kit.fontawesome.com/7419d8869f.js" crossOrigin="anonymous" strategy="beforeInteractive" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <RouteGuard>
              <ChatProvider>
                <DateProvider>
                  <PageTransitionProvider>
                    <AppLayout>
                      {children}
                      <GlobalChat />
                    </AppLayout>
                  </PageTransitionProvider>
                </DateProvider>
              </ChatProvider>
            </RouteGuard>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
