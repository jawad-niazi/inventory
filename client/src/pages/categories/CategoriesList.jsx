import React, { useEffect, useState } from "react";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

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
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Categories</h2>
      <ShopSelector value={shopId} onChange={setShopId} />

      {shopId && (
        <>
          <form
            onSubmit={handleCreate}
            className="mb-6 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className={`${inputClass} max-w-xs flex-1`}
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add Category
            </button>
          </form>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="px-4 py-3 text-sm">
                        {editId === cat.id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={inputClass}
                          />
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {editId === cat.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdate(cat.id)}
                                className="text-sm text-indigo-600 hover:underline"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                className="text-sm text-gray-500 hover:underline"
                              >
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
                                className="text-sm text-indigo-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat.id)}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                        No categories yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
