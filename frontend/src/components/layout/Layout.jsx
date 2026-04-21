import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
};

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-brand-parchment text-ink">
      <a href="#main-content" className="skip-to-content" data-testid="skip-to-content">Skip to content</a>
      <Navbar />
      <motion.main
        id="main-content"
        tabIndex={-1}
        key={location.pathname}
        data-testid="layout-main"
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
