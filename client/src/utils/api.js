import { supabase } from "../services/supabase";

// Environment-aware BASE_URL:
// - Local dev: VITE_API_URL is empty → BASE_URL = "" → Vite proxy handles /api/* → localhost:4000
// - Production (Netlify): VITE_API_URL = "https://inventory-4zxb.onrender.com" (set in Netlify env vars)
export const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function getToken() {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token;
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };

  if (!options.isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (options.isFormData) {
    delete headers["Content-Type"];
  }

  const fullPath = `${BASE_URL}${path}`;
  const res = await fetch(fullPath, { ...options, headers });
  return res;
}

export async function fetchShops() {
  const res = await apiFetch("/api/shops");
  if (res.ok) {
    const body = await res.json();
    return body.shops || [];
  }
  return [];
}