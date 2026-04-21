import { useEffect, useState } from "react";
import { fetchSiteSettings } from "@/lib/api";

// Module-level cache so Footer + pages share one fetch per session
let _cache = null;
let _inflight = null;
const _listeners = new Set();

async function _load() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;
  _inflight = fetchSiteSettings()
    .then((d) => {
      _cache = d || {};
      _listeners.forEach((fn) => fn(_cache));
      return _cache;
    })
    .catch(() => {
      _cache = {};
      return _cache;
    })
    .finally(() => { _inflight = null; });
  return _inflight;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(_cache || {});
  useEffect(() => {
    let alive = true;
    const cb = (d) => { if (alive) setSettings(d); };
    _listeners.add(cb);
    if (!_cache) _load().then(cb);
    return () => { alive = false; _listeners.delete(cb); };
  }, []);
  return settings;
}

// Sensible fallbacks so the footer & legal pages never render a blank line
// when site_settings hasn't seeded yet. These mirror /app/backend/seed.py.
export const SITE_FALLBACKS = {
  company_name:       "Kadle Global Pvt Ltd",
  cin:                "U62099KA2025PTC207992",
  registered_address: "Bengaluru, Karnataka, India",
  support_email:      "support@karijeeva.in",
  legal_email:        "legal@karijeeva.in",
  privacy_email:      "privacy@karijeeva.in",
  support_phone:      "+91 80 4860 4860",
  hours_ist:          "Mon–Sat · 9:30 AM – 6:30 PM IST",
  fssai_license:      "10024001000000",
  parent_site_url:    "https://kadleglobal.com",
  instagram_url:      "https://instagram.com/karijeeva",
  facebook_url:       "https://facebook.com/karijeeva",
  youtube_url:        "https://youtube.com/@karijeeva",
  whatsapp_url:       "https://wa.me/918048604860",
  linkedin_url:       "https://linkedin.com/company/kadle-global",
};

export const pick = (settings, key) => settings?.[key] ?? SITE_FALLBACKS[key] ?? "";
