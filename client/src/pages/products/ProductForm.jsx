import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function ProductForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop_id") || "";
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "0",
    category_id: "",
    low_stock_threshold: "0",
    status: "active",
    initial_quantity: "0",
  });

  useEffect(() => {
    if (!shopId) return;
    apiFetch(`/api/categories?shop_id=${shopId}`).then(async (res) => {
      if (res.ok) {
        const body = await res.json();
        setCategories(body.categories || []);
      }
    });
  }, [shopId]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/api/products/${id}`);
      if (res.ok) {
        const body = await res.json();
        const p = body.product;
        setForm({
          name: p.name || "",
          sku: p.sku || "",
          description: p.description || "",
          price: String(p.price ?? 0),
          category_id: p.category_id || "",
          low_stock_threshold: String(p.low_stock_threshold ?? 0),
          status: p.status || "active",
          initial_quantity: String(p.quantity ?? 0),
        });
        if (p.image_url) setPreview(p.image_url);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async (productId) => {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append("image", imageFile);
    await apiFetch(`/api/products/${productId}/image`, {
      method: "POST",
      body: fd,
      isFormData: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return;

    const payload = {
      shop_id: shopId,
      name: form.name,
      sku: form.sku || null,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      category_id: form.category_id || null,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 0,
      status: form.status,
    };

    if (!id) {
      payload.initial_quantity = parseInt(form.initial_quantity, 10) || 0;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/products/${id}` : "/api/products";
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const body = await res.json();
      const productId = id || body.product?.id;
      if (productId && imageFile) await uploadImage(productId);
      navigate(`/products?shop_id=${shopId}`);
    }
  };

  if (!shopId) {
    return (
      <p className="text-gray-600">
        Missing shop. Go back to{" "}
        <button
          type="button"
          onClick={() => navigate("/products")}
          className="text-indigo-600 hover:underline"
        >
          Products
        </button>{" "}
        and select a shop.
      </p>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        {id ? "Edit Product" : "Add Product"}
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Low stock threshold
              </label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {!id && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Initial quantity
              </label>
              <input
                name="initial_quantity"
                type="number"
                min="0"
                value={form.initial_quantity}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 h-24 w-24 rounded object-cover"
              />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
