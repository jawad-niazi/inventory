import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ShopSelector from "../../components/common/ShopSelector";
import { apiFetch } from "../../utils/api";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopId, setShopId] = useState(searchParams.get("shop_id") || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

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

  const handleShopChange = (id) => setShopId(id);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(q.toLowerCase()) ||
      (p.model_name || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        {shopId && (
          <Link
            to={`/products/new?shop_id=${shopId}`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add Product
          </Link>
        )}
      </div>

      <ShopSelector value={shopId} onChange={handleShopChange} />

      {shopId && (
        <>
          <input
            placeholder="Search by name, Product Code or Model..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mb-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((p) => {
                    const low =
                      p.low_stock_threshold > 0 &&
                      p.quantity <= p.low_stock_threshold;
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                N/A
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.product_code || p.sku || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.model_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.categories?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          Rs. {Number(p.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={
                              low ? "font-medium text-red-600" : "text-gray-900"
                            }
                          >
                            {p.quantity}
                            {low && " (low)"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/products/${p.id}/edit?shop_id=${shopId}`,
                                )
                              }
                              className="text-sm text-indigo-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        No products found.
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
