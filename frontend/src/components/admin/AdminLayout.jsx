import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, Package, Boxes, Users, Star, Tag,
  Mail, MessageSquare, Settings, FileSearch, Inbox, LogOut, Leaf,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/admin",              label: "Dashboard",    icon: LayoutDashboard, end: true },
  { to: "/admin/orders",       label: "Orders",       icon: ShoppingBag },
  { to: "/admin/products",     label: "Products",     icon: Package },
  { to: "/admin/inventory",    label: "Inventory",    icon: Boxes },
  { to: "/admin/customers",    label: "Customers",    icon: Users },
  { to: "/admin/reviews",      label: "Reviews",      icon: Star },
  { to: "/admin/coupons",      label: "Coupons",      icon: Tag },
  { to: "/admin/newsletter",   label: "Newsletter",   icon: Mail },
  { to: "/admin/requests",     label: "Requests",     icon: Inbox },
  { to: "/admin/contact",      label: "Messages",     icon: MessageSquare },
  { to: "/admin/settings",     label: "Settings",     icon: Settings },
  { to: "/admin/audit",        label: "Audit log",    icon: FileSearch },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const onLogout = async () => { await logout(); nav("/login", { replace: true }); };

  return (
    <div className="min-h-screen flex bg-brand-parchment" data-testid="admin-layout">
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 text-brand-parchment border-r border-brand-gold/20"
        style={{ backgroundColor: "#141009" }}
        data-testid="admin-sidebar"
      >
        <Link to="/admin" className="px-6 py-5 border-b border-brand-gold/20 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-brand-gold" />
          <span className="font-display text-xl text-brand-gold tracking-wide">Karijeeva</span>
          <Badge className="ml-auto bg-brand-gold/15 text-brand-gold border-0 font-body text-[9px] tracking-widest uppercase">Admin</Badge>
        </Link>
        <nav className="flex-1 py-4 overflow-y-auto" data-testid="admin-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              data-testid={`admin-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-5 py-2.5 font-body text-sm transition",
                "text-brand-parchment/75 hover:text-brand-gold hover:bg-white/5",
                isActive && "text-brand-gold bg-white/8 border-l-2 border-brand-gold -ml-[2px] pl-[22px]",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="px-5 py-4 border-t border-brand-gold/20 flex items-center gap-3 font-body text-sm text-brand-parchment/75 hover:text-brand-gold hover:bg-white/5 transition"
          data-testid="admin-logout"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 min-w-0">
        <header className="sticky top-0 z-20 bg-brand-parchment/85 backdrop-blur border-b border-brand-gold/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/admin" className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-brand-gold" />
              <span className="font-display text-lg text-brand-obsidian">Karijeeva Admin</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-3 font-body text-sm text-brand-husk">
            <span className="text-ink-muted">/</span>
            <span className="capitalize">{loc.pathname.replace(/^\/admin\/?/, "") || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/" className="font-body text-xs tracking-[0.2em] uppercase text-brand-obsidian hover:text-brand-gold">View storefront</Link>
            <div className="h-6 w-px bg-brand-gold/30" />
            <div className="text-right leading-tight">
              <div className="font-display text-brand-obsidian text-sm" data-testid="admin-user-name">{user?.name}</div>
              <div className="font-body text-[10px] tracking-widest uppercase text-brand-gold">Admin</div>
            </div>
          </div>
        </header>
        {/* Mobile nav scroller */}
        <nav className="md:hidden border-b border-brand-gold/15 bg-white overflow-x-auto flex no-scrollbar">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => cn(
                "shrink-0 px-4 py-3 font-body text-xs uppercase tracking-widest text-brand-husk/70",
                isActive && "text-brand-obsidian border-b-2 border-brand-gold",
              )}
            >{label}</NavLink>
          ))}
        </nav>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
