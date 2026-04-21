import { api, API } from "@/lib/api";

export const adminApi = {
  // Dashboard
  stats:   () => api.get("/admin/dashboard/stats").then((r) => r.data),
  trend:   (days = 30) => api.get("/admin/dashboard/trend", { params: { days } }).then((r) => r.data),
  latest:  () => api.get("/admin/dashboard/latest").then((r) => r.data),

  // Orders
  ordersList:   (params) => api.get("/admin/orders", { params }).then((r) => r.data),
  orderDetail:  (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  orderStatus:  (id, status, note) => api.patch(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),
  orderShipping:(id, data) => api.patch(`/admin/orders/${id}/shipping`, data).then((r) => r.data),
  ordersCsvUrl: (params = {}) => `${API}/admin/orders/export.csv?${new URLSearchParams(params).toString()}`,

  // Products
  productsList:  (params) => api.get("/admin/products", { params }).then((r) => r.data),
  productDetail: (id) => api.get(`/admin/products/${id}`).then((r) => r.data),
  productCreate: (body) => api.post("/admin/products", body).then((r) => r.data),
  productUpdate: (id, body) => api.patch(`/admin/products/${id}`, body).then((r) => r.data),
  productDelete: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  variantCreate: (productId, body) => api.post(`/admin/products/${productId}/variants`, body).then((r) => r.data),
  variantUpdate: (variantId, body) => api.patch(`/admin/variants/${variantId}`, body).then((r) => r.data),
  variantDelete: (variantId) => api.delete(`/admin/variants/${variantId}`).then((r) => r.data),

  // Inventory
  inventoryList:   (params) => api.get("/admin/inventory", { params }).then((r) => r.data),
  inventoryUpdate: (variantId, body) => api.patch(`/admin/inventory/${variantId}`, body).then((r) => r.data),
  inventoryLogs:   (params) => api.get("/admin/inventory/logs", { params }).then((r) => r.data),

  // Customers
  customersList:   (params) => api.get("/admin/customers", { params }).then((r) => r.data),
  customerDetail:  (id) => api.get(`/admin/customers/${id}`).then((r) => r.data),
  customersCsvUrl: () => `${API}/admin/customers/export.csv`,

  // Reviews
  reviewsList:  (status) => api.get("/admin/reviews", { params: { status } }).then((r) => r.data),
  reviewAction: (id, action, reason) => api.patch(`/admin/reviews/${id}`, { action, reason }).then((r) => r.data),

  // Coupons
  couponsList:  () => api.get("/admin/coupons").then((r) => r.data),
  couponCreate: (body) => api.post("/admin/coupons", body).then((r) => r.data),
  couponUpdate: (code, body) => api.patch(`/admin/coupons/${code}`, body).then((r) => r.data),
  couponDelete: (code) => api.delete(`/admin/coupons/${code}`).then((r) => r.data),
  couponStats:  (code) => api.get(`/admin/coupons/${code}/stats`).then((r) => r.data),

  // Newsletter
  newsletterList:   (params) => api.get("/admin/newsletter", { params }).then((r) => r.data),
  newsletterCsvUrl: () => `${API}/admin/newsletter/export.csv`,

  // Requests
  requestsList:  (status) => api.get("/admin/requests", { params: { status } }).then((r) => r.data),
  requestUpdate: (id, body) => api.patch(`/admin/requests/${id}`, body).then((r) => r.data),

  // Contact
  contactList:   (status) => api.get("/admin/contact", { params: { status } }).then((r) => r.data),
  contactUpdate: (id, status) => api.patch(`/admin/contact/${id}`, { status }).then((r) => r.data),

  // Settings
  settingsGet:   () => api.get("/admin/settings").then((r) => r.data),
  settingsPatch: (body) => api.patch("/admin/settings", body).then((r) => r.data),

  // Audit
  auditList: (params) => api.get("/admin/audit", { params }).then((r) => r.data),
};

export const STATUS_COLORS = {
  pending_payment:   "bg-amber-100 text-amber-800",
  paid:              "bg-emerald-100 text-emerald-800",
  processing:        "bg-sky-100 text-sky-800",
  shipped:           "bg-indigo-100 text-indigo-800",
  out_for_delivery:  "bg-violet-100 text-violet-800",
  delivered:         "bg-green-200 text-green-900",
  cancelled:         "bg-stone-200 text-stone-700",
  payment_failed:    "bg-red-100 text-red-700",
  refunded:          "bg-orange-100 text-orange-800",
};

export const formatINR = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (s, withTime = false) => {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(withTime && { hour: "2-digit", minute: "2-digit" }) });
  } catch { return s; }
};
