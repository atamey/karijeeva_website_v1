import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/ErrorBoundary";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import PillarPage from "@/pages/PillarPage";
import Contact from "@/pages/Contact";
import DesignSystem from "@/pages/DesignSystem";
import RazorpayPoc from "@/pages/RazorpayPoc";
import { Login, Register } from "@/pages/Auth";
import Checkout from "@/pages/Checkout";
import OrderConfirmed from "@/pages/OrderConfirmed";
import OrderTrack from "@/pages/OrderTrack";
import Wishlist from "@/pages/Wishlist";
import { Account, Orders } from "@/pages/Account";
import NotFound from "@/pages/NotFound";

// Phase 9 — footer / handoff surfaces
import FAQsPage from "@/pages/FAQs";
import TrackOrder from "@/pages/TrackOrder";
import {
  TheFarm, ColdPressProcess, Sustainability, Press, Careers,
  GiftCards, SubscribeSave,
} from "@/pages/brand/BrandPages";
import {
  ShippingPolicy, ReturnsPolicy, PrivacyPolicy, TermsOfService, CookiePolicy,
} from "@/pages/legal/Policies";

import AdminRoute from "@/components/admin/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
// Lazy-load admin pages — separate bundle
const AdminDashboard     = lazy(() => import("@/pages/admin/Dashboard"));
const AdminOrders        = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail   = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminProducts      = lazy(() => import("@/pages/admin/Products"));
const AdminInventory     = lazy(() => import("@/pages/admin/Inventory"));
const AdminInventoryLogs = lazy(() => import("@/pages/admin/Inventory").then((m) => ({ default: m.InventoryLogs })));
const AdminCustomers     = lazy(() => import("@/pages/admin/Customers"));
const AdminCustomerDetail = lazy(() => import("@/pages/admin/Customers").then((m) => ({ default: m.CustomerDetail })));
const AdminReviews       = lazy(() => import("@/pages/admin/Reviews"));
const AdminCoupons       = lazy(() => import("@/pages/admin/Coupons"));
const AdminNewsletter    = lazy(() => import("@/pages/admin/Newsletter"));
const AdminRequests      = lazy(() => import("@/pages/admin/Requests"));
const AdminContactMessages = lazy(() => import("@/pages/admin/ContactMessages"));
const AdminSettings      = lazy(() => import("@/pages/admin/Settings"));
const AdminAudit         = lazy(() => import("@/pages/admin/Audit"));

function AdminFallback() {
  return (
    <div className="min-h-screen bg-brand-parchment flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-brand-obsidian" data-testid="admin-suspense">
        <div className="w-10 h-10 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
        <p className="font-body text-xs uppercase tracking-widest text-brand-gold">Loading admin…</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const wrap = (el) => <Layout>{el}</Layout>;
  const admin = (el) => (
    <AdminRoute>
      <AdminLayout>
        <Suspense fallback={<AdminFallback />}>{el}</Suspense>
      </AdminLayout>
    </AdminRoute>
  );
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<Home />)} />
        <Route path="/products" element={wrap(<Products />)} />
        <Route path="/products/:slug" element={wrap(<ProductDetail />)} />
        <Route path="/about" element={wrap(<About />)} />
        <Route path="/blog" element={wrap(<Blog />)} />
        <Route path="/blog/:slug" element={wrap(<BlogDetail />)} />
        <Route path="/recipes" element={wrap(<Recipes />)} />
        <Route path="/recipes/:slug" element={wrap(<RecipeDetail />)} />
        <Route path="/cold-pressed-coconut-oil-benefits" element={wrap(<PillarPage />)} />
        <Route path="/contact" element={wrap(<Contact />)} />
        <Route path="/design-system" element={wrap(<DesignSystem />)} />
        <Route path="/login" element={wrap(<Login />)} />
        <Route path="/register" element={wrap(<Register />)} />
        <Route path="/checkout" element={wrap(<Checkout />)} />
        <Route path="/orders/:order_id/confirmed" element={wrap(<OrderConfirmed />)} />
        <Route path="/orders/:order_id/track" element={wrap(<OrderTrack />)} />
        <Route path="/wishlist" element={wrap(<Wishlist />)} />
        <Route path="/account" element={wrap(<Account />)} />
        <Route path="/account/orders" element={wrap(<Orders />)} />

        {/* Phase 9 — footer surfaces */}
        <Route path="/faqs"                element={wrap(<FAQsPage />)} />
        <Route path="/track-order"         element={wrap(<TrackOrder />)} />
        <Route path="/the-farm"            element={wrap(<TheFarm />)} />
        <Route path="/cold-press-process"  element={wrap(<ColdPressProcess />)} />
        <Route path="/sustainability"      element={wrap(<Sustainability />)} />
        <Route path="/press"               element={wrap(<Press />)} />
        <Route path="/careers"             element={wrap(<Careers />)} />
        <Route path="/gift-cards"          element={wrap(<GiftCards />)} />
        <Route path="/subscribe-save"      element={wrap(<SubscribeSave />)} />
        <Route path="/shipping-policy"     element={wrap(<ShippingPolicy />)} />
        <Route path="/returns-policy"      element={wrap(<ReturnsPolicy />)} />
        <Route path="/privacy-policy"      element={wrap(<PrivacyPolicy />)} />
        <Route path="/terms"               element={wrap(<TermsOfService />)} />
        <Route path="/cookie-policy"       element={wrap(<CookiePolicy />)} />

        {/* Admin — separate shell, no storefront Layout */}
        <Route path="/admin" element={admin(<AdminDashboard />)} />
        <Route path="/admin/orders" element={admin(<AdminOrders />)} />
        <Route path="/admin/orders/:id" element={admin(<AdminOrderDetail />)} />
        <Route path="/admin/products" element={admin(<AdminProducts />)} />
        <Route path="/admin/inventory" element={admin(<AdminInventory />)} />
        <Route path="/admin/inventory/logs" element={admin(<AdminInventoryLogs />)} />
        <Route path="/admin/customers" element={admin(<AdminCustomers />)} />
        <Route path="/admin/customers/:id" element={admin(<AdminCustomerDetail />)} />
        <Route path="/admin/reviews" element={admin(<AdminReviews />)} />
        <Route path="/admin/coupons" element={admin(<AdminCoupons />)} />
        <Route path="/admin/newsletter" element={admin(<AdminNewsletter />)} />
        <Route path="/admin/requests" element={admin(<AdminRequests />)} />
        <Route path="/admin/contact" element={admin(<AdminContactMessages />)} />
        <Route path="/admin/settings" element={admin(<AdminSettings />)} />
        <Route path="/admin/audit" element={admin(<AdminAudit />)} />

        {/* Razorpay POC — standalone chrome (Phase 0 untouched) */}
        <Route path="/razorpay-poc" element={<RazorpayPoc />} />
        {/* 404 catch-all */}
        <Route path="*" element={wrap(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="App">
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
                <Toaster position="top-right" richColors />
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
