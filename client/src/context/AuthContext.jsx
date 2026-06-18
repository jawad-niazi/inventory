import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setRole(null);
      setShopId(null);
      return null;
    }

    setProfileLoading(true);
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const body = await res.json();
        setRole(body.profile?.role ?? null);
        setShopId(body.profile?.shop_id ?? null);
        return body;
      }

      setRole(null);
      setShopId(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
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

  const signout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setShopId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        shopId,
        loading,
        profileLoading,
        signin,
        signout,
        fetchProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
