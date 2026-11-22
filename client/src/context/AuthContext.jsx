import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { apiFetch, BASE_URL } from "../utils/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [shopName, setShopName] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setRole(null);
      setShopId(null);
      setShopName(null);
      setShops([]);
      return null;
    }

    setProfileLoading(true);
    try {
      // Register the user in the backend (creates app_users row if missing)
      await apiFetch("/api/auth/register", { method: "POST" });

      // Fetch the user's profile (role, shop_id, shops, etc.)
      const res = await apiFetch("/api/auth/me");

      if (res.ok) {
        const body = await res.json();
        const userRole = body.profile?.role ?? null;
        const userShopId = body.profile?.shop_id ?? null;
        const assignedShopName = body.profile?.shops?.name ?? null;

        setRole(userRole);

        // Fetch shops list for shop selection
        const shopsRes = await apiFetch("/api/shops");
        let shopsList = [];
        if (shopsRes.ok) {
          const sBody = await shopsRes.json();
          shopsList = sBody.shops || [];
          setShops(shopsList);
        }

        if (userRole === "super_admin") {
          const storedShopId = localStorage.getItem("current_shop_id");
          const active = shopsList.find((s) => s.id === storedShopId) || shopsList[0];
          if (active) {
            setShopId(active.id);
            setShopName(active.name);
            localStorage.setItem("current_shop_id", active.id);
            localStorage.setItem("current_shop_name", active.name);
          }
        } else {
          setShopId(userShopId);
          const matchedShop = shopsList.find((s) => s.id === userShopId);
          const nameToSet = assignedShopName || matchedShop?.name || localStorage.getItem("current_shop_name") || null;
          setShopName(nameToSet);
          if (userShopId) localStorage.setItem("current_shop_id", userShopId);
          if (nameToSet) localStorage.setItem("current_shop_name", nameToSet);
        }

        return body;
      }

      setRole(null);
      setShopId(null);
      setShopName(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const switchShop = useCallback((id, name) => {
    setShopId(id);
    if (name) {
      setShopName(name);
      localStorage.setItem("current_shop_name", name);
    }
    localStorage.setItem("current_shop_id", id);
    window.dispatchEvent(new CustomEvent("shopChange", { detail: { shopId: id, shopName: name } }));
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadProfile();
      }

      if (mounted) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadProfile();
      } else {
        setRole(null);
        setShopId(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signin = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data?.session) {
      await loadProfile();
    }
    return res;
  };

  const signup = async (email, password, shopName) => {
    const endpoint = `${BASE_URL}/api/auth/signup`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, shop_name: shopName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create account and shop");
    }

    // Automatically sign in with newly created credentials
    const loginRes = await signin(email, password);
    if (loginRes.error) {
      throw new Error(loginRes.error.message || "Account created, but automatic sign in failed. Please sign in.");
    }
    return data;
  };

  const signout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setShopId(null);
    setShopName(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        shopId,
        shopName,
        shops,
        switchShop,
        loading,
        profileLoading,
        signin,
        signup,
        signout,
        fetchProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
