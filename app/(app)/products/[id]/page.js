'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchProduct = () => {
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data.product);
        setEditForm({
          name: data.product.name,
          sku: data.product.sku,
          categoryId: data.product.categoryId || '',
          uom: data.product.uom,
          reorderPoint: data.product.reorderPoint,
          price: data.product.price || 0,
          imageUrl: data.product.imageUrl || '',
          isVisibleOnStore: data.product.isVisibleOnStore ?? true,
          description: data.product.description || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProduct();
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update');
        return;
      }

      setSaveSuccess('Product updated successfully!');
      setEditing(false);
      fetchProduct();
    } catch {
      setError('An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-100 max-w-lg mx-auto">
        <p className="text-red-600 font-semibold mb-2">Error</p>
        <p className="text-slate-600 text-sm mb-4">{error}</p>
        <Link href="/products" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          ← Back to products
        </Link>
      </div>
    );
  }

  const isLow = product.reorderPoint > 0 && product.totalStock <= product.reorderPoint && product.totalStock > 0;
  const isOut = product.totalStock === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/products" className="hover:text-indigo-600 font-medium">Products</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{product.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/adjustments?productId=${product.id}`}
            className="px-3.5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            Adjust Stock
          </Link>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20"
          >
            {editing ? 'Cancel Editing' : 'Edit Product'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          {saveSuccess}
        </div>
      )}

      {/* Main Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
        {!editing ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-start gap-4">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                    {product.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                    {isOut ? (
                      <span className="badge badge-canceled">Out of Stock</span>
                    ) : isLow ? (
                      <span className="badge badge-waiting">Low Stock Alert</span>
                    ) : (
                      <span className="badge badge-done">In Stock</span>
                    )}
                    {product.isVisibleOnStore ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Storefront Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        Hidden from Storefront
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-slate-500 mt-1">SKU: {product.sku}</p>
                  {product.description && (
                    <p className="text-sm text-slate-600 mt-2 max-w-2xl">{product.description}</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 min-w-[200px] text-right flex-shrink-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Quantity</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                  {product.totalStock}{' '}
                  <span className="text-sm font-normal text-slate-500">{product.uom}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500 font-medium">Store Price</span>
                <p className="text-lg font-bold text-slate-900 mt-1">₹{Number(product.price || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500 font-medium">Category</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{product.category?.name || 'Uncategorized'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500 font-medium">Unit of Measure</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{product.uom}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-500 font-medium">Warehouses Stored</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{product.stockLevels.length} locations</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Edit Product Information</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <input
                  required
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Point</label>
                <input
                  type="number"
                  step="0.001"
                  value={editForm.reorderPoint}
                  onChange={(e) => setEditForm({ ...editForm, reorderPoint: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Store Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="editIsVisibleOnStore"
                checked={editForm.isVisibleOnStore ?? true}
                onChange={(e) => setEditForm({ ...editForm, isVisibleOnStore: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <label htmlFor="editIsVisibleOnStore" className="text-sm font-medium text-slate-700 cursor-pointer">
                Show product on Customer Storefront (Public Warehouse Catalog)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stock Availability Broken Down By Location (FR-PROD-02) */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Stock Availability by Location</h2>
            <p className="text-xs text-slate-500 mt-0.5">Physical distribution across warehouses & racks</p>
          </div>
          <Link
            href="/transfers"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            Transfer Between Locations →
          </Link>
        </div>

        {product.stockLevels.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No stock records found for this product in any location.</p>
            <p className="text-xs text-slate-400 mt-1">Receive inventory or perform a stock adjustment to add units.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Location / Warehouse</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Available Quantity</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.stockLevels.map((sl) => (
                  <tr key={sl.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{sl.location.name}</td>
                    <td className="px-6 py-3.5 text-sm font-mono text-slate-500">{sl.location.code}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-right text-slate-900">
                      {sl.quantity} <span className="font-normal text-xs text-slate-500">{product.uom}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-right text-slate-400">
                      {new Date(sl.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
