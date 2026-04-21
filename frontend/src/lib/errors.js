/**
 * Format a FastAPI error detail (which can be a string, array of {msg,...}, or object)
 * into a single user-facing string. Avoids React crashes when rendering errors.
 */
export function formatApiError(detail, fallback = "Something went wrong. Please try again.") {
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail === "object") {
    if (typeof detail.error === "string") return detail.error;
    if (typeof detail.msg === "string") return detail.msg;
    return JSON.stringify(detail);
  }
  return String(detail);
}
