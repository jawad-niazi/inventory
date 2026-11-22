import React, { useEffect, useState } from "react";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";
import { Plus, Edit, Trash2, Check, X, Tag } from "lucide-react";

export default function CategoriesList() {
  const [shopId, setShopId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    const res = await apiFetch(`/api/categories?shop_id=${shopId}`);
    if (res.ok) {
      const body = await res.json();
      setCategories(body.categories || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await apiFetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ shop_id: shopId, name: name.trim() }),
    });
    if (res.ok) {
      setName("");
      load();
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    const res = await apiFetch(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      setEditId(null);
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    const res = await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <ShopSelector value={shopId} onChange={setShopId} />
      </div>

      {shopId && (
        <>
          {/* Add Category Form Card */}
          <div data-tour="add-category-card" className="mb-8 rounded-4xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Add New Category
            </h3>
            <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3 max-w-xl">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name..."
                className="flex-1 min-w-[240px] rounded-full border-0 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all shadow-sm"
              />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-brand-neon px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                Add Category
              </button>
            </form>
          </div>

          {/* Categories Table Card */}
          {loading ? (
            <p className="text-slate-500 font-medium ml-2">Loading categories...</p>
          ) : (
            <div className="rounded-4xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-100 bg-white">
                    <tr>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Category Name
                      </th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-50/80 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          {editId === cat.id ? (
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="rounded-full border-0 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-neon focus:bg-white w-full max-w-xs"
                              autoFocus
                            />
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-bold text-slate-800">
                              {cat.name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editId === cat.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdate(cat.id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-neon px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-sm hover:shadow-md transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditId(null)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditId(cat.id);
                                    setEditName(cat.name);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Edit category"
                                >
                                  <Edit size={15} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(cat.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete category"
                                >
                                  <Trash2 size={15} />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                        >
                          No categories found. Add your first category above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between text-sm text-slate-500">
                <p className="font-medium">
                  Total <span className="font-bold text-slate-900">{categories.length}</span>{" "}
                  {categories.length === 1 ? "category" : "categories"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
