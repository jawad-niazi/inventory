import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Plus, ArrowRightLeft } from "lucide-react";
import Modal from "../../components/common/Modal";
import TransferCreate from "./TransferCreate";

export default function TransferList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDirection, setFilterDirection] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/transfers?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setTransfers(body.transfers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const handleFormSuccess = () => {
    closeModal();
    load();
  };

  const filtered = transfers.filter((t) => {
    if (filterDirection === "outgoing") return t.from_shop_id === shopId;
    if (filterDirection === "incoming") return t.to_shop_id === shopId;
    return true;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Stock Transfers
        </h2>
        {shopId && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-full bg-brand-neon px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            New Transfer
          </button>
        )}
      </div>

      <div className="mb-6">
        <ShopSelector value={shopId} onChange={(id) => { setShopId(id); setIsModalOpen(false); }} />
      </div>

      {shopId && (
        <>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterDirection("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filterDirection === "all"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-inset ring-slate-200"
              }`}
            >
              All Transfers
            </button>
            <button
              onClick={() => setFilterDirection("outgoing")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filterDirection === "outgoing"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-inset ring-slate-200"
              }`}
            >
              Outgoing (From this Shop)
            </button>
            <button
              onClick={() => setFilterDirection("incoming")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filterDirection === "incoming"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 ring-1 ring-inset ring-slate-200"
              }`}
            >
              Incoming (To this Shop)
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500 font-medium py-4">Loading...</p>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Direction
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        From Shop
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        To Shop
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const isOutgoing = t.from_shop_id === shopId;
                      return (
                        <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors duration-200 group">
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {new Date(t.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                isOutgoing
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                              }`}
                            >
                              {isOutgoing ? "Outgoing" : "Incoming"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {t.from_shop?.name || "Origin Shop"}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {t.to_shop?.name || "Destination Shop"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                t.status === "received"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "shipped"
                                  ? "bg-blue-100 text-blue-800"
                                  : t.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/transfers/${t.id}?shop_id=${shopId}`}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              View & Process
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          No transfers found.
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

      {/* Transfer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Initiate Stock Transfer"
      >
        <TransferCreate 
          shopId={shopId} 
          onSuccess={handleFormSuccess} 
          onCancel={closeModal} 
        />
      </Modal>
    </div>
  );
}
