import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AdminProtectedRoute({ children }) {
  const { user, role, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "super_admin") return <Navigate to="/dashboard" replace />;
  return children;
}
