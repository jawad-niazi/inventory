import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function CustomerForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    current_balance: "",
  });

  useEffect(() => {
    if (!id) return;
    const loadCustomer = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/customers/${id}?shop_id=${shopId}`);
        if (res.ok) {
          const body = await res.json();
          const c = body.customer;
          if (c) {
            setForm({
              name: c.name || "",
              phone: c.phone || "",
              email: c.email || "",
              address: c.address || "",
              current_balance: c.current_balance ?? "",
            });
          } else {
            setError("Customer not found");
          }
        } else {
          setError("Failed to load customer details");
        }
      } catch {
        setError("Network error loading customer");
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id, shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Customer Name is required");
      return;
    }

    setSubmitting(true);
    const url = id ? `/api/customers/${id}` : "/api/customers";
    const method = id ? "PUT" : "POST";

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
    };

    // Only include current_balance on create (initial balance seed)
    if (!id && form.current_balance !== "") {
      payload.current_balance = Number(form.current_balance) || 0;
    }

    if (!id) {
      payload.shop_id = shopId;
    }

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (res.ok) {
        navigate(`/customers?shop_id=${shopId}`);
      } else {
        setError(body.error || "Failed to save customer");
      }
    } catch {
      setError("Network error saving customer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-4 text-gray-600">Loading customer data...</div>;
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        {id ? "Edit Customer" : "Add New Customer"}
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="Enter customer full name"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
            placeholder="e.g. +92 300 1234567"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
            placeholder="e.g. customer@example.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} min-h-[90px]`}
            placeholder="Enter customer address"
          />
        </div>

        {/* Initial balance only visible on create */}
        {!id && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Opening Balance (Rs.)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.current_balance}
              onChange={(e) =>
                setForm({ ...form, current_balance: e.target.value })
              }
              className={inputClass}
              placeholder="0.00 — leave blank for zero"
            />
            <p className="mt-1 text-xs text-gray-400">
              Enter any existing Udhaar balance this customer already owes you.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(`/customers?shop_id=${shopId}`)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? "Saving..." : id ? "Update Customer" : "Add Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
