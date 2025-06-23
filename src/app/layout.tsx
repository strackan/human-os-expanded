import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { DateProvider } from "@/context/DateContext";
import GlobalChat from "@/components/GlobalChat";
import AppLayout from "@/components/layout/AppLayout";
import { PageTransitionProvider } from "../components/layout/PageTransitionContext";
import AuthProviderWrapper from "@/components/auth/AuthProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Renubu",
  description: "Contract Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProviderWrapper>
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
        </AuthProviderWrapper>
      </body>
    </html>
  );
}