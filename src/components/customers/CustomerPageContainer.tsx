"use client";
import { useState, useEffect } from "react";
import AcmePage from "./AcmePage";
import InitechPage from "./InitechPage";

const customerComponents: Record<string, any> = {
  acme: AcmePage,
  initech: InitechPage,
};

export default function CustomerPageContainer() {
  const [current, setCurrent] = useState<string>("acme");
  const [next, setNext] = useState<string | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const customer = params.get('customer');
    if (customer && customerComponents[customer]) {
      setCurrent(customer);
    } else {
      setCurrent('acme');
    }
  }, []);

  const handleNextCustomer = (customerKey: string) => {
    console.log('DEBUG: handleNextCustomer called', customerKey);
    setNext(customerKey);
    setIsSliding(true);
    setTimeout(() => {
      setCurrent(customerKey);
      setIsSliding(false);
      setNext(null);
      console.log('DEBUG: current customer set to', customerKey);
    }, 400);
  };

  // Only render after mount to avoid hydration mismatch
  if (!mounted) return null;

  const CurrentComponent = customerComponents[current];
  const NextComponent = next ? customerComponents[next] : null;

  return (
    <div className="relative overflow-hidden h-full min-h-screen">
      <div className={`absolute inset-0 transition-transform duration-400 ${isSliding ? "-translate-x-full" : "translate-x-0"}`}>
        <CurrentComponent onNextCustomer={handleNextCustomer} />
      </div>
      {NextComponent && (
        <div className={`absolute inset-0 transition-transform duration-400 ${isSliding ? "translate-x-0" : "translate-x-full"}`}>
          <NextComponent onNextCustomer={handleNextCustomer} />
        </div>
      )}
    </div>
  );
} 