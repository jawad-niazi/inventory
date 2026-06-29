import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import Modal from "../../components/common/Modal";
import QuotationCreate from "./QuotationCreate";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/50",
  sent: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  accepted: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
  expired: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
};

export default function Quotations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/quotations?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setQuotations(body.quotations || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this quotation?")) return;
    const res = await apiFetch(`/api/quotations/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleFormSuccess = (quotationId) => {
    closeModal();
    load();
    if (quotationId) {
      navigate(`/quotations/${quotationId}?shop_id=${shopId}`);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Kacha Bill / Estimates — no stock deduction</p>
        </div>
        {shopId && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-full bg-brand-neon px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            New Quotation
          </button>
        )}
      </div>

      <div className="mb-6">
        <ShopSelector value={shopId} onChange={(id) => { setShopId(id); setIsModalOpen(false); }} />
      </div>

      {shopId && (
        <>
          {loading ? (
            <div className="py-4 text-slate-500 font-medium">Loading quotations...</div>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Quote #
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Customer
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Total
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr key={q.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors duration-200 group">
                        <td className="px-6 py-4 text-sm font-bold font-mono text-slate-900">
                          {q.quote_number}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {q.customer_name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                              STATUS_COLORS[q.status] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200/50"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 font-mono text-right">
                          Rs. {Number(q.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                          {new Date(q.created_at).toLocaleDateString("en-PK")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/quotations/${q.id}?shop_id=${shopId}`)
                              }
                              title="View Quotation"
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                            >
                              <ExternalLink size={18} />
                            </button>
                            {["draft", "sent"].includes(q.status) && (
                              <button
                                type="button"
                                onClick={() => handleDelete(q.id)}
                                title="Delete Quotation"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          No quotations yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quotation Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Quotation"
      >
        <QuotationCreate 
          shopId={shopId} 
          onSuccess={handleFormSuccess} 
          onCancel={closeModal} 
        />
      </Modal>
    </div>
  );
}
