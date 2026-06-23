import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function SupplierForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!id) return;
    const loadSupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/suppliers?shop_id=${shopId}`);
        if (res.ok) {
          const body = await res.json();
          const s = (body.suppliers || []).find((x) => x.id === id);
          if (s) {
            setForm({
              company_name: s.company_name || "",
              phone: s.phone || "",
              address: s.address || "",
            });
          } else {
            setError("Supplier not found");
          }
        } else {
          setError("Failed to load supplier details");
        }
      } catch {
        setError("Network error loading supplier");
      } finally {
        setLoading(false);
      }
    };
    loadSupplier();
  }, [id, shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.company_name.trim()) {
      setError("Company Name is required");
      return;
    }

    setSubmitting(true);
    const url = id ? `/api/suppliers/${id}` : "/api/suppliers";
    const method = id ? "PUT" : "POST";
    const payload = id ? form : { ...form, shop_id: shopId };

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (res.ok) {
        navigate(`/suppliers?shop_id=${shopId}`);
      } else {
        setError(body.error || "Failed to save supplier");
      }
    } catch {
      setError("Network error saving supplier");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-4 text-gray-600">Loading supplier data...</div>;
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        {id ? "Edit Supplier" : "Add Supplier"}
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className={inputClass}
            placeholder="Enter supplier company name"
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
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} min-h-[100px]`}
            placeholder="Enter supplier address"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(`/suppliers?shop_id=${shopId}`)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? "Saving..." : "Save Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
