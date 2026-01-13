import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useHasMounted } from "./PageTransitionContext";
import LoadingSpinner from "./LoadingSpinner";
import { useState } from "react";

const variants = {
  initial: { x: 0, opacity: 1, scale: 1 },
  exit: { x: "100%", opacity: 0, scale: 0.98 },
  enter: { x: "-100%", opacity: 0, scale: 1.02 },
  animate: { x: 0, opacity: 1, scale: 1 },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const [showSpinner, setShowSpinner] = useState(false);

  // Check if we're on the initial customer page (no customer parameter or customer=acme)
  const isInitialCustomerPage = !searchParams.has('customer') || searchParams.get('customer') === 'acme';

  if (!hasMounted) {
    return <>{children}</>;
  }

  // If it's the initial customer page, render without animation
  if (isInitialCustomerPage) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        setShowSpinner(false);
      }}
    >
      {showSpinner ? (
        <LoadingSpinner key="spinner" />
      ) : (
        <motion.div
          key={pathname}
          initial="enter"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
          style={{ position: "relative", width: "100%" }}
          onAnimationStart={() => setShowSpinner(false)}
          onAnimationComplete={(definition) => {
            if (definition === "exit") setShowSpinner(true);
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 