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
    product_code: "",
    model_name: "",
    price: "0",
    category_id: "",
    low_stock_threshold: "0",
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
          product_code: p.product_code || p.sku || "",
          model_name: p.model_name || "",
          price: String(p.price ?? 0),
          category_id: p.category_id || "",
          low_stock_threshold: String(p.low_stock_threshold ?? 0),
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
    fd.append("image", imageFile); // Key name matching backend upload.single('image')

    try {
      // apiFetch ko bypass karke direct browser fetch use karein taake headers block na hon
      console.log("[ProductForm] uploading image for productId=", productId);
      const response = await fetch(`/api/products/${productId}/image`, {
        method: "POST",
        body: fd,
      });

      console.log(
        "[ProductForm] image upload response status=",
        response.status,
      );
      if (!response.ok) {
        const txt = await response.text().catch(() => null);
        console.error(
          "[ProductForm] Image upload failed status:",
          response.status,
          txt,
        );
        // throw so caller knows upload failed
        throw new Error(`Image upload failed: ${response.status}`);
      }

      console.log(
        "[ProductForm] Image uploaded successfully to backend/cloudinary",
      );
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
      // status defaults to 'active' on the backend — removed from form
    };

    if (!id) {
      payload.initial_quantity = parseInt(form.initial_quantity, 10) || 0;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/products/${id}` : "/api/products";
    try {
      console.log(
        "[ProductForm] Sending product payload to",
        url,
        "method=",
        method,
        "payload=",
        payload,
      );
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      console.log("[ProductForm] Product save response status=", res.status);
      const body = await (res.ok ? res.json() : res.json().catch(() => ({})));

      if (!res.ok) {
        console.error(
          "[ProductForm] Failed to save product:",
          body.error || body || res.status,
        );
        alert("Failed to save product: " + (body.error || res.status));
        return;
      }

      console.log("[ProductForm] Product saved successfully", body);
      const productId = id || body.product?.id;
      if (productId && imageFile) {
        try {
          console.log(
            "[ProductForm] Starting image upload for productId=",
            productId,
          );
          await uploadImage(productId);
          console.log(
            "[ProductForm] Image upload finished for productId=",
            productId,
          );
        } catch (uploadErr) {
          console.error(
            "[ProductForm] Image upload failed after product save:",
            uploadErr,
          );
          alert(
            "Product saved but image upload failed. You can retry uploading the image from product details.",
          );
          // still navigate, because product exists — user can retry image upload
          navigate(`/products?shop_id=${shopId}`);
          return;
        }
      }

      // Only navigate after both product save and image upload (if any) have completed
      navigate(`/products?shop_id=${shopId}`);
    } catch (err) {
      console.error("[ProductForm] Unexpected error during save:", err);
      alert("Unexpected error saving product. Check console for details.");
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
          className="p-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          {/* Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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

          {/* Product Code (was SKU) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Model Name
              <span className="ml-1 text-xs text-gray-400">
                (e.g. Galaxy A35, iPhone 15)
              </span>
            </label>
            <input
              name="model_name"
              value={form.model_name}
              onChange={handleChange}
              placeholder="e.g. Galaxy A35"
              className={inputClass}
            />
          </div>

          {/* Price + Low stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
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
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Low stock alert
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

          {/* Category */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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

          {/* Initial Quantity (create only) */}
          {!id && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Initial Quantity
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

          {/* Product Image */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
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
                className="object-cover w-24 h-24 mt-2 rounded"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate(`/products?shop_id=${shopId}`)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
