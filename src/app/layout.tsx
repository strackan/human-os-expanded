import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
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
            <PageTransitionProvider>
              <AppLayout>
                {children}
                <GlobalChat />
              </AppLayout>
            </PageTransitionProvider>
          </ChatProvider>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}