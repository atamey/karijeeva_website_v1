import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { SITE_FALLBACKS } from "@/lib/siteSettings";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reported: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Non-blocking client error report
    api.post("/errors/client", {
      message: error?.message || String(error),
      stack: (error?.stack || "").slice(0, 8000),
      url: typeof window !== "undefined" ? window.location.href : "",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      component: info?.componentStack?.split("\n")[1]?.trim() || "",
    }).then(() => this.setState({ reported: true })).catch(() => {});
  }

  reset = () => { this.setState({ hasError: false, reported: false }); };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-brand-parchment flex items-center justify-center px-6" data-testid="error-boundary">
        <div className="max-w-xl w-full bg-white border border-brand-gold/25 rounded-lg p-10 text-center shadow-[0_12px_48px_rgba(11, 8, 6,0.08)]">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-parchment-soft flex items-center justify-center text-brand-gold">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <p className="eyebrow text-brand-gold tracking-[0.3em] mt-6">Technical hiccup</p>
          <h1 className="font-display text-h2 text-brand-obsidian mt-2">Something's brewing</h1>
          <p className="font-body text-brand-husk mt-3 leading-relaxed">
            A small unexpected error interrupted your visit. It has been reported to us.
            Please try again — a fresh load usually fixes it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" onClick={this.reset} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-pill bg-brand-obsidian text-brand-gold font-body text-xs tracking-widest uppercase hover:bg-brand-obsidian-soft">
              <Home className="w-4 h-4" /> Go home
            </Link>
            <a href={`mailto:${SITE_FALLBACKS.support_email}?subject=Something%20broke%20on%20the%20site`} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-pill border border-brand-gold/40 text-brand-obsidian hover:bg-brand-gold/10 font-body text-xs tracking-widest uppercase">
              <Mail className="w-4 h-4" /> Report issue
            </a>
          </div>
          {this.state.reported && <p className="mt-6 font-body text-xs text-ink-muted">Error report sent. Thank you.</p>}
        </div>
      </div>
    );
  }
}
