import { supabase } from "../services/supabase";

const BASE_URL = import.meta.env.PROD 
  ? "https://inventory-4zxb.onrender.com" 
  : "";

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

  const res = await fetch(path, { ...options, headers });
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
