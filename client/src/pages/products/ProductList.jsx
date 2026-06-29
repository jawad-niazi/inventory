import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Edit, Trash2, Search, Plus } from "lucide-react";
import Modal from "../../components/common/Modal";
import ProductForm from "./ProductForm";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState(null);

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/products?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setProducts(body.products || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  useEffect(() => {
    if (shopId) setSearchParams({ shop_id: shopId });
  }, [shopId, setSearchParams]);

  const handleShopChange = (id) => {
    setShopId(id);
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const openModal = (id = null) => {
    setEditProductId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditProductId(null);
  };

  const handleFormSuccess = () => {
    closeModal();
    load();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(q.toLowerCase()) ||
      (p.model_name || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h2>
        {shopId && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-full bg-brand-neon px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Add Product
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <ShopSelector value={shopId} onChange={handleShopChange} />

        {shopId && (
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="block w-full rounded-full border-0 py-2.5 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon bg-white shadow-sm"
            />
          </div>
        )}
      </div>

      {shopId && (
        <>
          {loading ? (
            <p className="text-slate-500 font-medium ml-2">Loading...</p>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Product
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Code
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Category
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Price
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Stock
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const low =
                        p.low_stock_threshold > 0 &&
                        p.quantity <= p.low_stock_threshold;
                      return (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors duration-200 group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt=""
                                  className="h-12 w-12 rounded-2xl object-cover shadow-sm bg-slate-50 ring-1 ring-slate-100"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100 text-xs font-medium text-slate-400 shadow-sm">
                                  N/A
                                </div>
                              )}
                              <div>
                                <span className="block text-sm font-bold text-slate-900 group-hover:text-brand-neon transition-colors">
                                  {p.name}
                                </span>
                                <span className="block text-xs font-medium text-slate-400 mt-0.5">
                                  {p.model_name || "No Model"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {p.product_code || p.sku || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {p.categories?.name || "Uncategorized"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            Rs. {Number(p.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                low ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              }`}
                            >
                              {p.quantity} {low && " (Low)"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openModal(p.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
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
                          No products found matching your search.
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

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editProductId ? "Edit Product" : "Add Product"}
      >
        <ProductForm 
          productId={editProductId} 
          shopId={shopId} 
          onSuccess={handleFormSuccess} 
          onCancel={closeModal} 
        />
      </Modal>
    </div>
  );
}
