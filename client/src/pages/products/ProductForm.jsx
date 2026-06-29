import React, { useEffect, useState } from "react";
import { apiFetch, getToken } from "../../utils/api";

const inputClass =
  "w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-neon focus:bg-white transition-all";

export default function ProductForm({ productId, shopId, onSuccess, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!productId);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    product_code: "",
    model_name: "",
    price: "0",
    category_id: "",
    low_stock_threshold: "0",
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
    if (!productId) return;
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/api/products/${productId}`);
      if (res.ok) {
        const body = await res.json();
        const p = body.product;
        setForm({
          name: p.name || "",
          product_code: p.product_code || p.sku || "",
          model_name: p.model_name || "",
          price: String(p.price ?? 0),
          category_id: p.category_id || "",
          low_stock_threshold: String(p.low_stock_threshold ?? 0),
        });
        if (p.image_url) setPreview(p.image_url);
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async (id) => {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append("image", imageFile); 
    try {
      const token = await getToken();
      const response = await fetch(`/api/products/${id}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error("Error uploading image:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) return;

    const payload = {
      shop_id: shopId,
      name: form.name,
      product_code: form.product_code || form.sku || null,
      sku: form.product_code || form.sku || null,
      model_name: form.model_name || null,
      price: parseFloat(form.price) || 0,
      category_id: form.category_id || null,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 0,
    };

    const method = productId ? "PUT" : "POST";
    const url = productId ? `/api/products/${productId}` : "/api/products";
    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const body = await (res.ok ? res.json() : res.json().catch(() => ({})));

      if (!res.ok) {
        alert("Failed to save product: " + (body.error || res.status));
        return;
      }

      const pId = productId || body.product?.id;
      if (pId && imageFile) {
        try {
          await uploadImage(pId);
        } catch (uploadErr) {
          alert("Product saved but image upload failed.");
          if (onSuccess) onSuccess();
          return;
        }
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[ProductForm] Unexpected error during save:", err);
      alert("Unexpected error saving product. Check console for details.");
    }
  };

  if (!shopId) {
    return <p className="text-slate-500 font-medium">Missing shop ID.</p>;
  }

  if (loading) {
    return <p className="text-slate-500 font-medium">Loading product details...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Product Name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Minimalist Desk Lamp"
            className={inputClass}
          />
        </div>

        {/* Product Code */}
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Product Code
          </label>
          <input
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
            placeholder="e.g. PC-001"
            className={inputClass}
          />
        </div>

        {/* Model Name */}
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Model Name
          </label>
          <input
            name="model_name"
            value={form.model_name}
            onChange={handleChange}
            placeholder="e.g. Model X"
            className={inputClass}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Sale Price (Rs.)
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

        {/* Low stock */}
        <div>
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Low Stock Threshold
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

        {/* Category */}
        <div className="sm:col-span-2">
          <label className="block mb-2 text-sm font-bold text-slate-700">
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

        {/* Product Image */}
        <div className="sm:col-span-2">
          <label className="block mb-2 text-sm font-bold text-slate-700">
            Product Image
          </label>
          <div className="flex items-center gap-6">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="object-cover w-24 h-24 rounded-2xl ring-1 ring-slate-200 shadow-sm"
              />
            ) : (
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-50 ring-1 ring-slate-200 shadow-sm text-slate-400 text-xs font-medium">
                No Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm font-medium text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-neon file:text-slate-900 hover:file:bg-brand-neon/80 transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
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
          className="px-6 py-3 text-sm font-bold text-slate-900 bg-brand-neon rounded-full hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
        >
          {productId ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
