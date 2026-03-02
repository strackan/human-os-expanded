import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { LogoBar } from "@/components/v2/logo-bar";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Proof } from "@/components/v2/proof";
import { MidCta } from "@/components/v2/mid-cta";
import { WhyItWorks } from "@/components/why-it-works";
import { WhoItsFor } from "@/components/who-its-for";
import { Pricing } from "@/components/v2/pricing";
import { Faq, FaqSchema } from "@/components/v2/faq";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Fancy Robot Creative — Does AI Recommend Your Brand?",
  description:
    "We measure how AI sees your brand across ChatGPT, Claude, Gemini, and more. Get your free AI Visibility Score in 30 seconds.",
};

export default function NewSitePage() {
  return (
    <>
      <FaqSchema />
      <Navbar />
      <main>
        <Hero />
        <LogoBar />
        <Problem />
        <HowItWorks />
        <Proof />
        <MidCta />
        <WhyItWorks />
        <WhoItsFor />
        <Pricing />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
