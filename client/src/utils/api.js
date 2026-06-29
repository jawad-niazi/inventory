import { supabase } from "../services/supabase";

// 🌐 Jab live chalega toh Render ka URL pakray ga, local par empty string
const BASE_URL = "https://inventory-4zxb.onrender.com";

console.log("BASE_URL:", BASE_URL); // Debug ke liye

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

  // 🎯 Yahan hum ne BASE_URL ko path ke sath jor diya hai
  const fullPath = `${BASE_URL}${path}`;

  // 🚀 Ab fetch direct path par nahi, balki fullPath par request bhejega
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