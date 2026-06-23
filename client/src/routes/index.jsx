import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "../App";
import Login from "../pages/auth/Login";
import ResetPassword from "../pages/auth/ResetPassword";
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

// Suppliers Pages
import SuppliersList from "../pages/suppliers/SuppliersList";
import SupplierForm from "../pages/suppliers/SupplierForm";

// Quotations Pages
import Quotations from "../pages/quotations/Quotations";
import QuotationCreate from "../pages/quotations/QuotationCreate";
import QuotationDetails from "../pages/quotations/QuotationDetails";

// Sales Pages
import SalesList from "../pages/sales/SalesList";
import SaleCreate from "../pages/sales/SaleCreate";
import SaleDetails from "../pages/sales/SaleDetails";

// Purchases Pages
import PurchaseList from "../pages/purchases/PurchaseList";
import PurchaseCreate from "../pages/purchases/PurchaseCreate";
import PurchaseDetails from "../pages/purchases/PurchaseDetails";

// Transfers Pages
import TransferList from "../pages/transfers/TransferList";
import TransferCreate from "../pages/transfers/TransferCreate";
import TransferDetails from "../pages/transfers/TransferDetails";

// Invoices Pages
import Invoices from "../pages/invoices/Invoices";
import InvoiceDetails from "../pages/invoices/InvoiceDetails";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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

          {/* Sales Routes */}
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/new" element={<SaleCreate />} />
          <Route path="/sales/:id" element={<SaleDetails />} />

          {/* Purchases Routes */}
          <Route path="/purchases" element={<PurchaseList />} />
          <Route path="/purchases/new" element={<PurchaseCreate />} />
          <Route path="/purchases/:id" element={<PurchaseDetails />} />

          {/* Transfers Routes */}
          <Route path="/transfers" element={<TransferList />} />
          <Route path="/transfers/new" element={<TransferCreate />} />
          <Route path="/transfers/:id" element={<TransferDetails />} />

          {/* Invoices Routes */}
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />

          {/* Suppliers Routes */}
          <Route path="/suppliers" element={<SuppliersList />} />
          <Route path="/suppliers/new" element={<SupplierForm />} />
          <Route path="/suppliers/:id/edit" element={<SupplierForm />} />

          {/* Quotations Routes */}
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/quotations/new" element={<QuotationCreate />} />
          <Route path="/quotations/:id" element={<QuotationDetails />} />

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
