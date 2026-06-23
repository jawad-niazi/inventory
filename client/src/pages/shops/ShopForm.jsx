import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../services/supabase";

function getToken() {
  return supabase.auth.getSession().then((s) => s.data.session?.access_token);
}

const inputClass =
  "w-full rounded-md border border-slate-350 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default function ShopForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    status: "active",
    admin_email: "",
    admin_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("/api/shops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        const shop = (body.shops || []).find((s) => s.id === id);
        if (shop)
          setForm({
            name: shop.name || "",
            address: shop.address || "",
            phone: shop.phone || "",
            email: shop.email || "",
            status: shop.status || "active",
          });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getToken();
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/shops/${id}` : "/api/shops";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      if (method === "POST") {
        const body = await res.json();
        if (body.credentials) {
          setCreatedCredentials(body.credentials);
          return;
        }
      }
      navigate("/shops");
    } else {
      const body = await res.json();
      alert(body.error || "Save failed");
    }
  };

  if (createdCredentials) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg text-slate-100">
        <h3 className="text-xl font-bold text-emerald-400 mb-4">Shop Onboarded Successfully</h3>
        <p className="text-sm text-slate-350 mb-4">
          A new tenant user account has been automatically created for this shop. Please copy the temporary credentials below:
        </p>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 mb-6 font-mono text-sm">
          <div>
            <span className="text-slate-500">Email:</span> <span className="text-white select-all">{createdCredentials.email}</span>
          </div>
          <div>
            <span className="text-slate-500">Password:</span> <span className="text-white select-all">{createdCredentials.password}</span>
          </div>
          <div>
            <span className="text-slate-500">Role:</span> <span className="text-emerald-400">{createdCredentials.role}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/shops")}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
        >
          Got it, Go to Shop List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">
        {id ? "Edit Shop" : "Create Shop"}
      </h2>
      {loading ? (
        <div className="text-slate-650">Loading...</div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Name
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
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          {!id && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Shop Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_email"
                  type="email"
                  value={form.admin_email}
                  onChange={handleChange}
                  required
                  placeholder="admin@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Shop Admin Password <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_password"
                  type="password"
                  value={form.admin_password}
                  onChange={handleChange}
                  required
                  placeholder="Min 8 characters"
                  minLength={8}
                  className={inputClass}
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate("/shops")}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
