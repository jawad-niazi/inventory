import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard", { replace: true });
    else navigate("/login", { replace: true });
  }, [user, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-600">
      Redirecting…
    </div>
  );
}
