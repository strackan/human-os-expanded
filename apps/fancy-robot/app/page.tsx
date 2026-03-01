import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { WhyItWorks } from "@/components/why-it-works";
import { WhoItsFor } from "@/components/who-its-for";
import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <WhyItWorks />
        <WhoItsFor />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
