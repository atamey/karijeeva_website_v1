import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, Heart, User, ShoppingBag, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "About", to: "/about" },
  { label: "Recipes", to: "/recipes" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const location = useLocation();
  const { totals, setDrawerOpen: setCartOpen } = useCart();
  const { user } = useAuth();
  const { count: wishCount } = useWishlist();
  const cartCount = totals.count;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Pulse on cart count change
  useEffect(() => {
    if (cartCount === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [cartCount]);

  return (
    <>
      <motion.header
        data-testid="navbar"
        data-scrolled={scrolled ? "true" : "false"}
        initial={false}
        animate={{
          backgroundColor: scrolled ? "rgba(11, 8, 6, 0.82)" : "rgba(11, 8, 6, 1)",
          backdropFilter: scrolled ? "blur(18px)" : "blur(0px)",
        }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b",
          scrolled ? "border-brand-gold/25" : "border-brand-gold/10",
        )}
        style={{ WebkitBackdropFilter: scrolled ? "blur(18px)" : "none" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
            <Leaf className="w-5 h-5 text-brand-gold transition-transform group-hover:rotate-6" />
            <span className="font-display text-2xl text-brand-gold tracking-wider">
              Karijeeva
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" data-testid="nav-links">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "relative px-4 py-2 font-body text-small text-brand-parchment/85 hover:text-brand-gold transition-colors",
                    isActive && "text-brand-gold"
                  )
                }
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Icon buttons */}
          <div className="flex items-center gap-1">
            <IconBtn label="Search" testId="nav-search"><Search /></IconBtn>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              data-testid="nav-wishlist"
              className="h-10 w-10 hidden sm:inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px] relative"
            >
              <span className="relative inline-flex">
                <Heart />
                {user && wishCount > 0 && (
                  <span data-testid="nav-wishlist-count" className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-brand-gold text-[10px] font-body font-semibold text-brand-obsidian-soft flex items-center justify-center px-1">
                    {wishCount}
                  </span>
                )}
              </span>
            </Link>
            <Link
              to={user ? "/account" : "/login"}
              aria-label="Account"
              data-testid="nav-account"
              className="h-10 w-10 hidden sm:inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]"
            >
              <User />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              data-testid="nav-cart"
              className={cn(
                "h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]",
                pulse && "animate-pulse"
              )}
            >
              <span className="relative inline-flex">
                <ShoppingBag />
                {cartCount > 0 && (
                  <span data-testid="nav-cart-count" className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-brand-gold text-[10px] font-body font-semibold text-brand-obsidian-soft flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment hover:text-brand-gold hover:bg-brand-gold/10 transition"
              aria-label="Open menu"
              data-testid="nav-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
            data-testid="mobile-drawer"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="absolute inset-0 glass-dark flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gold/25">
                <span className="font-display text-2xl text-brand-gold">Karijeeva</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment hover:text-brand-gold"
                  aria-label="Close menu"
                  data-testid="mobile-drawer-close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col justify-center items-center gap-6 px-6">
                {NAV_LINKS.map((link, idx) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06, duration: 0.45 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setDrawerOpen(false)}
                      className="font-display text-4xl text-brand-parchment hover:text-brand-gold transition-colors"
                      data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="px-6 py-8 border-t border-brand-gold/25 flex items-center justify-center gap-6 text-brand-parchment">
                <IconBtn label="Search"><Search /></IconBtn>
                <Link
                  to="/wishlist" aria-label="Wishlist"
                  onClick={() => setDrawerOpen(false)}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]"
                >
                  <Heart />
                </Link>
                <Link
                  to={user ? "/account" : "/login"} aria-label="Account"
                  onClick={() => setDrawerOpen(false)}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]"
                >
                  <User />
                </Link>
                <button
                  onClick={() => { setDrawerOpen(false); setCartOpen(true); }}
                  aria-label="Cart"
                  className="h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]"
                >
                  <ShoppingBag />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer so content starts below fixed navbar */}
      <div className="h-[72px]" aria-hidden="true" />
    </>
  );
}

function IconBtn({ children, label, testId, className }) {
  return (
    <button
      aria-label={label}
      data-testid={testId}
      className={cn(
        "h-10 w-10 inline-flex items-center justify-center rounded-pill text-brand-parchment/90 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px]",
        className
      )}
    >
      {children}
    </button>
  );
}
