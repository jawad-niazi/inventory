import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-600">
      Loading...
    </div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
