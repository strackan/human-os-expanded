import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, VT323, Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./hover-glitch.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  weight: "400",
  variable: "--font-press-start",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://goodhang.club'),
  title: {
    default: "Good Hang - Tech Noir Social Club",
    template: "%s | Good Hang"
  },
  description: "An exclusive social club for tech professionals who want more than networking—they want adventure. Raleigh, NC.",
  keywords: [
    "tech social club",
    "tech professionals Raleigh",
    "exclusive social club",
    "tech noir",
    "networking events Raleigh",
    "tech community NC",
    "curated events",
    "tech culture",
    "Raleigh nightlife",
    "tech meetups"
  ],
  authors: [{ name: "Good Hang" }],
  creator: "Good Hang",
  publisher: "Good Hang",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goodhang.club",
    title: "Good Hang - Tech Noir Social Club",
    description: "An exclusive social club for tech professionals who want more than networking—they want adventure. Raleigh, NC.",
    siteName: "Good Hang",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Good Hang - Tech Noir Social Club"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Good Hang - Tech Noir Social Club",
    description: "An exclusive social club for tech professionals who want more than networking—they want adventure. Raleigh, NC.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: "#00ccdd",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://goodhang.club/#organization",
        "name": "Good Hang",
        "url": "https://goodhang.club",
        "logo": {
          "@type": "ImageObject",
          "url": "https://goodhang.club/icon-512.png",
          "width": 512,
          "height": 512
        },
        "description": "An exclusive social club for tech professionals who want more than networking—they want adventure.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Raleigh",
          "addressRegion": "NC",
          "addressCountry": "US"
        },
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": "https://goodhang.club/#website",
        "url": "https://goodhang.club",
        "name": "Good Hang - Tech Noir Social Club",
        "description": "An exclusive social club for tech professionals who want more than networking—they want adventure. Raleigh, NC.",
        "publisher": {
          "@id": "https://goodhang.club/#organization"
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "WebPage",
        "@id": "https://goodhang.club/#webpage",
        "url": "https://goodhang.club",
        "name": "Good Hang - Tech Noir Social Club",
        "isPartOf": {
          "@id": "https://goodhang.club/#website"
        },
        "about": {
          "@id": "https://goodhang.club/#organization"
        },
        "description": "An exclusive social club for tech professionals who want more than networking—they want adventure. Raleigh, NC.",
        "inLanguage": "en-US"
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} ${pressStart.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
