import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminProtectedRoute from "../components/common/AdminProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import ShopsList from "../pages/shops/ShopsList";
import ShopForm from "../pages/shops/ShopForm";
import ProductList from "../pages/products/ProductList";
import ProductForm from "../pages/products/ProductForm";
import CategoriesList from "../pages/categories/CategoriesList";
import InventoryList from "../pages/inventory/InventoryList";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/categories" element={<CategoriesList />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route
            path="/shops"
            element={
              <AdminProtectedRoute>
                <ShopsList />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/shops/new"
            element={
              <AdminProtectedRoute>
                <ShopForm />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/shops/:id/edit"
            element={
              <AdminProtectedRoute>
                <ShopForm />
              </AdminProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
