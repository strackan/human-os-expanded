import { NavbarAuthed } from "@/components/navbar-authed";
import { PricingAuthed } from "@/components/v2/pricing-authed";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  return (
    <>
      <NavbarAuthed />
      <main className="pt-24">
        <PricingAuthed />
      </main>
      <Footer />
    </>
  );
}
