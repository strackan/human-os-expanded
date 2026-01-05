import type { Metadata } from "next";
import { Courier_Prime, Playfair_Display, Special_Elite } from "next/font/google";
import "./roadtrip.css";

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  subsets: ["latin"],
});

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-special-elite",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Renubu Road Show | Dec 29, 2025 - Jan 30, 2026",
  description: "Join Justin on an epic road trip across America. Connect at planned stops or invite him to your city. Let's hang!",
  keywords: ["road trip", "networking", "startup", "Renubu", "AI", "Customer Success"],
  openGraph: {
    title: "The Renubu Road Show",
    description: "Join Justin on an epic road trip across America. Connect at planned stops or invite him to your city.",
    type: "website",
    locale: "en_US",
    url: "https://goodhang.club/roadtrip",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Renubu Road Show",
    description: "Join Justin on an epic road trip across America. Let's hang!",
  },
};

export default function RoadtripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${courierPrime.variable} ${playfairDisplay.variable} ${specialElite.variable} roadtrip-fonts`}>
      {children}
    </div>
  );
}
