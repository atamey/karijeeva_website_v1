import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// credentials: include so httpOnly cookies (JWT) ride along
export const api = axios.create({ baseURL: API, timeout: 15000, withCredentials: true });

// Endpoints (typed where helpful, but JS)
export const fetchProducts  = (params) => api.get("/products", { params }).then((r) => r.data);
export const fetchProduct   = (slug) => api.get(`/products/${slug}`).then((r) => r.data);
export const fetchRecipes   = () => api.get("/recipes").then((r) => r.data);
export const fetchRecipe    = (slug) => api.get(`/recipes/${slug}`).then((r) => r.data);
export const fetchBlogList  = (category) => api.get("/blog", { params: { category } }).then((r) => r.data);
export const fetchBlogPost  = (slug) => api.get(`/blog/${slug}`).then((r) => r.data);
export const fetchTestimonials = () => api.get("/testimonials").then((r) => r.data);
export const fetchFaqs      = (category) => api.get("/faqs", { params: { category } }).then((r) => r.data);
export const fetchSiteSettings = () => api.get("/site-settings").then((r) => r.data);

export const postNewsletter = (email, source = "footer") =>
  api.post("/newsletter/subscribe", { email, source }).then((r) => r.data);

export const postContact = (payload) =>
  api.post("/contact", payload).then((r) => r.data);
