import type { Metadata } from "next";
import { Inter, Nunito, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { DateProvider } from "@/context/DateContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GlobalChat from "@/components/GlobalChat";
import AppLayout from "@/components/layout/AppLayout";
import { PageTransitionProvider } from "../components/layout/PageTransitionContext";
// import AuthProviderWrapper from "@/components/auth/AuthProviderWrapper";
import AuthProvider from "@/components/auth/AuthProvider";
import RouteGuard from "@/components/auth/RouteGuard";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import VersionIndicator from "@/components/layout/VersionIndicator";

const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "600", "700"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["700", "800", "900"] });

export const metadata: Metadata = {
  title: "Renubu - Expansion Intelligence Platform for Customer Success",
  description: "Built For Growth. Designed For Value. The ultimate Expansion Intelligence Platform for Customer Success teams to drive revenue growth and customer retention.",
  openGraph: {
    title: "Renubu - Expansion Intelligence Platform for Customer Success",
    description: "Built For Growth. Designed For Value. The ultimate Expansion Intelligence Platform for Customer Success teams.",
    url: "https://www.renubu.com",
    siteName: "Renubu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Renubu - Expansion Intelligence Platform for Customer Success",
    description: "Built For Growth. Designed For Value. The ultimate Expansion Intelligence Platform for Customer Success teams.",
  },
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
      <body className={`${inter.className} ${nunito.variable} ${fraunces.variable}`}>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <RouteGuard>
                  <ChatProvider>
                    <DateProvider>
                      <PageTransitionProvider>
                        <AppLayout>
                          {children}
                          <GlobalChat />
                          <VersionIndicator />
                        </AppLayout>
                      </PageTransitionProvider>
                    </DateProvider>
                  </ChatProvider>
                </RouteGuard>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
