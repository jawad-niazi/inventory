import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function SupplierForm({ supplierId, shopId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(!!supplierId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    address: "",
    current_balance: "",
  });

  useEffect(() => {
    if (!supplierId) return;
    const loadSupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/suppliers?shop_id=${shopId}`);
        if (res.ok) {
          const body = await res.json();
          const s = (body.suppliers || []).find((x) => x.id === supplierId);
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
  }, [supplierId, shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.company_name.trim()) {
      setError("Company Name is required");
      return;
    }

    setSubmitting(true);
    const url = supplierId ? `/api/suppliers/${supplierId}` : "/api/suppliers";
    const method = supplierId ? "PUT" : "POST";
    const payload = supplierId ? form : { ...form, shop_id: shopId };
    
    if (!supplierId && form.current_balance !== "") {
      payload.current_balance = Number(form.current_balance) || 0;
    }

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (res.ok) {
        if (onSuccess) onSuccess();
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
    return <div className="py-4 text-slate-500 font-medium">Loading supplier data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
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
          <label className="block mb-2 text-sm font-bold text-slate-700">
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
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} min-h-[100px]`}
            placeholder="Enter supplier address"
          />
        </div>

        {!supplierId && (
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-700">
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
            <p className="mt-2 text-xs font-medium text-slate-400">
              Enter any existing balance owed to this supplier.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 text-sm font-bold text-slate-900 bg-brand-neon rounded-full hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] disabled:opacity-50 transition-all duration-200"
        >
          {submitting ? "Saving..." : "Save Supplier"}
        </button>
      </div>
    </form>
  );
}
