import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatApiError } from "@/lib/errors";

function AuthCard({ title, kicker, children, alt }) {
  return (
    <section className="bg-brand-parchment min-h-[calc(100vh-72px)] flex items-center">
      <div className="max-w-md w-full mx-auto px-6 py-16">
        <p className="eyebrow text-brand-gold tracking-[0.3em] text-center mb-3">{kicker}</p>
        <h1 className="text-h2 text-brand-obsidian text-center">{title}</h1>
        <div className="mt-10 brand-card p-8 bg-white">{children}</div>
        <p className="font-body text-sm text-ink-muted text-center mt-6">{alt}</p>
      </div>
    </section>
  );
}

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success("Welcome back.");
      const next = new URLSearchParams(loc.search).get("next");
      const fallback = u?.role === "admin" ? "/admin" : "/account";
      nav(next || loc.state?.from || fallback, { replace: true });
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Login failed"));
    } finally { setLoading(false); }
  };
  return (
    <>
      <Seo title="Log in" description="Log in to your Karijeeva account." />
      <AuthCard
        kicker="Welcome back"
        title="Log in to Karijeeva"
        alt={<>New here? <Link to="/register" className="text-brand-gold underline">Create an account</Link></>}
      >
        <form onSubmit={onSubmit} className="space-y-4" data-testid="login-form">
          <Input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className="h-11 bg-white border-brand-gold/30" data-testid="login-email" />
          <Input required type="password" placeholder="Password" value={form.password} onChange={set("password")} className="h-11 bg-white border-brand-gold/30" data-testid="login-password" />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" data-testid="login-submit">Log in</Button>
        </form>
      </AuthCard>
    </>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created.");
      nav("/account", { replace: true });
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Registration failed"));
    } finally { setLoading(false); }
  };
  return (
    <>
      <Seo title="Create an account" description="Join Karijeeva — faster checkout, order history, and exclusive batches." />
      <AuthCard
        kicker="Join us"
        title="Create your Karijeeva account"
        alt={<>Already have an account? <Link to="/login" className="text-brand-gold underline">Log in</Link></>}
      >
        <form onSubmit={onSubmit} className="space-y-4" data-testid="register-form">
          <Input required placeholder="Full name" value={form.name} onChange={set("name")} className="h-11 bg-white border-brand-gold/30" data-testid="register-name" />
          <Input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className="h-11 bg-white border-brand-gold/30" data-testid="register-email" />
          <Input required minLength={6} type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={set("password")} className="h-11 bg-white border-brand-gold/30" data-testid="register-password" />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full" data-testid="register-submit">Create account</Button>
        </form>
      </AuthCard>
    </>
  );
}
