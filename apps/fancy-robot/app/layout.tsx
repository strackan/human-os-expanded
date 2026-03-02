import React from "react";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Fancy Robot Creative — Does AI Recommend Your Brand?",
  description:
    "We measure how AI sees your brand, find the gaps, and fix them. Get your AI Visibility Score today.",
};

export const viewport: Viewport = {
  themeColor: "#f5f0e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --background: oklch(0.97 0.005 80);
                --foreground: oklch(0.22 0.02 55);
                --card: oklch(0.99 0.003 80);
                --card-foreground: oklch(0.22 0.02 55);
                --popover: oklch(0.99 0.003 80);
                --popover-foreground: oklch(0.22 0.02 55);
                --primary: oklch(0.25 0.02 55);
                --primary-foreground: oklch(0.97 0.005 80);
                --secondary: oklch(0.94 0.008 80);
                --secondary-foreground: oklch(0.35 0.02 55);
                --muted: oklch(0.93 0.008 80);
                --muted-foreground: oklch(0.52 0.02 55);
                --accent: oklch(0.68 0.14 25);
                --accent-foreground: oklch(0.99 0.003 80);
                --destructive: oklch(0.577 0.245 27.325);
                --border: oklch(0.88 0.01 80);
                --input: oklch(0.94 0.008 80);
                --ring: oklch(0.68 0.14 25);
                --radius: 0.75rem;
              }
              body { background: oklch(0.97 0.005 80); color: oklch(0.22 0.02 55); }
            `,
          }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${spaceMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
