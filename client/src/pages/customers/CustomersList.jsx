import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Edit, Trash2, Search, Plus, FileText } from "lucide-react";
import Modal from "../../components/common/Modal";
import CustomerForm from "./CustomerForm";

export default function CustomersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/customers?shop_id=${shopId}`);
      if (res.ok) {
        const body = await res.json();
        setCustomers(body.customers || []);
      } else {
        const body = await res.json();
        setError(body.error || "Failed to load customers");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        load();
      } else {
        const body = await res.json();
        alert(body.error || "Failed to delete customer");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const openModal = (id = null) => {
    setEditCustomerId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCustomerId(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    load();
  };

  const filtered = (customers || []).filter((c) => {
    const name = (c?.name || "").toLowerCase();
    const phone = (c?.phone || "").toLowerCase();
    const email = (c?.email || "").toLowerCase();
    const qv = (q || "").toLowerCase();
    return name.includes(qv) || phone.includes(qv) || email.includes(qv);
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Customers
        </h2>
        {shopId && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-full bg-brand-neon px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add Customer
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <ShopSelector value={shopId} onChange={(id) => { setShopId(id); setIsModalOpen(false); }} />

        {shopId && (
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              placeholder="Search by name, phone, or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="block w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon bg-white shadow-sm"
            />
          </div>
        )}
      </div>

      {shopId && (
        <>
          {error && (
            <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-4 text-slate-500 font-medium">Loading...</div>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Customer Name
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Phone
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Outstanding Balance
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((customer) => (
                        <tr
                          key={customer?.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors duration-200 group"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 group-hover:text-brand-neon transition-colors">
                            {customer?.name || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {customer?.phone || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {customer?.email || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-right">
                            <span
                              className={
                                Number(customer?.current_balance || 0) > 0
                                  ? "inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100"
                                  : "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                              }
                            >
                              Rs.{" "}
                              {Number(customer?.current_balance || 0).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/customers/${customer.id}?shop_id=${shopId}`)
                                }
                                title="View Ledger"
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                              >
                                <FileText size={18} />
                              </button>
                              <button
                                onClick={() => openModal(customer.id)}
                                title="Edit Customer"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(customer.id)}
                                title="Delete Customer"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editCustomerId ? "Edit Customer" : "Add Customer"}
      >
        <CustomerForm 
          customerId={editCustomerId} 
          shopId={shopId} 
          onSuccess={handleFormSuccess} 
          onCancel={closeModal} 
        />
      </Modal>
    </div>
  );
}
