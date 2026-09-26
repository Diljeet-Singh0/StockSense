'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [stockTab, setStockTab] = useState(searchParams.get('filter') || 'all');
  const [copiedSku, setCopiedSku] = useState(null);

  // Quick Adjust Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ locationId: '', countedQty: '', reason: 'PHYSICAL_COUNT' });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    uom: 'pcs',
    reorderPoint: 0,
    description: '',
    initialStock: 0,
    locationId: '',
    price: 0,
    imageUrl: '',
    isVisibleOnStore: true,
  });

  const fetchProducts = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCategory) params.set('category', filterCategory);
    if (stockTab === 'low') params.set('filter', 'low');
    if (stockTab === 'out') params.set('filter', 'out');

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
  }, [search, filterCategory, stockTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(`Product "${data.product.name}" created successfully!`);
    setShowForm(false);
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      uom: 'pcs',
      reorderPoint: 0,
      description: '',
      initialStock: 0,
      locationId: '',
      price: 0,
      imageUrl: '',
      isVisibleOnStore: true,
    });
    fetchProducts();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, data.category]);
      setNewCategory('');
      setShowCategoryForm(false);
    }
  };

  const handleCopySku = (sku) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const openQuickAdjust = (product) => {
    setAdjustModalProduct(product);
    setAdjustForm({
      locationId: locations[0]?.id || '',
      countedQty: product.totalStock.toString(),
      reason: 'PHYSICAL_COUNT',
    });
    setAdjustError('');
  };

  const handleQuickAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustLoading(true);

    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustModalProduct.id,
          locationId: adjustForm.locationId,
          countedQty: Number(adjustForm.countedQty),
          reason: adjustForm.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdjustError(data.error || 'Failed to update stock');
        return;
      }

      setSuccess(`Stock updated for ${adjustModalProduct.name}!`);
      setAdjustModalProduct(null);
      fetchProducts();
    } catch {
      setAdjustError('Error adjusting stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Unit', 'Price (INR)', 'Total Stock', 'Reorder Point', 'Status', 'Store Visible'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.category?.name || 'Uncategorized'}"`,
      p.uom,
      p.price,
      p.totalStock,
      p.reorderPoint,
      p.totalStock === 0 ? 'Out of Stock' : p.reorderPoint > 0 && p.totalStock <= p.reorderPoint ? 'Low Stock' : 'In Stock',
      p.isVisibleOnStore ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered view by tabs
  const displayedProducts = products.filter((p) => {
    if (stockTab === 'low') return p.reorderPoint > 0 && p.totalStock <= p.reorderPoint && p.totalStock > 0;
    if (stockTab === 'out') return p.totalStock === 0;
    if (stockTab === 'in') return p.totalStock > 0 && (p.reorderPoint === 0 || p.totalStock > p.reorderPoint);
    if (stockTab === 'store') return p.isVisibleOnStore;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog & Master Inventory</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Maintain item master records, SKU configurations, store prices, and real-time physical stock counts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
            title="Download complete catalog as CSV"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-600/25 transition-all active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold animate-fade-in flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: 'all', label: 'All Catalog SKUs', icon: '📦' },
          { key: 'low', label: 'Low Stock Alerts', icon: '⚠️' },
          { key: 'out', label: 'Out of Stock', icon: '🚫' },
          { key: 'in', label: 'Healthy In Stock', icon: '✅' },
          { key: 'store', label: 'Storefront Visible', icon: '🏪' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStockTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              stockTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search & Category Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, barcode, or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
            title="Create new category"
          >
            + Category
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Scanning catalog records...</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-800 font-bold text-base">No matching products found</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search or clear active tab filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Available Stock</th>
                  <th className="px-4 py-3.5 text-center">Stock Level Status</th>
                  <th className="px-4 py-3.5 text-center">Storefront</th>
                  <th className="px-6 py-3.5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedProducts.map((p) => {
                  const isLow = p.reorderPoint > 0 && p.totalStock <= p.reorderPoint && p.totalStock > 0;
                  const isOut = p.totalStock === 0;
                  const healthPercent = p.reorderPoint > 0 ? Math.min(100, Math.round((p.totalStock / (p.reorderPoint * 2)) * 100)) : 100;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product & SKU */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <Link href={`/products/${p.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm block">
                              {p.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.sku}
                              </span>
                              <button
                                onClick={() => handleCopySku(p.sku)}
                                className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold"
                                title="Copy SKU"
                              >
                                {copiedSku === p.sku ? '✓ Copied' : 'copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Store Price */}
                      <td className="px-4 py-4 text-right font-extrabold text-slate-900 text-sm">
                        ₹{Number(p.price || 0).toFixed(2)}
                      </td>

                      {/* Total Stock */}
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {p.totalStock} {p.uom}
                        </span>
                        {p.reorderPoint > 0 && (
                          <p className="text-[10px] text-slate-400">Min safety: {p.reorderPoint} {p.uom}</p>
                        )}
                      </td>

                      {/* Status & Bar */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          {isOut ? (
                            <span className="badge badge-canceled">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-waiting">Low Stock ({p.totalStock}/{p.reorderPoint})</span>
                          ) : (
                            <span className="badge badge-done">Healthy</span>
                          )}

                          {/* Progress Health Bar */}
                          <div className="w-20 bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${isOut ? 5 : healthPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Storefront Visibility */}
                      <td className="px-4 py-4 text-center">
                        {p.isVisibleOnStore ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Store
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                            Internal
                          </span>
                        )}
                      </td>

                      {/* Operations Shortcuts */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/receipts?productId=${p.id}`}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                            title="Receive inbound shipment for this SKU"
                          >
                            + Receive
                          </Link>
                          <button
                            onClick={() => openQuickAdjust(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            title="Quick Stock Count / Physical Audit"
                          >
                            ⚖️ Count
                          </button>
                          <Link
                            href={`/products/${p.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Product Details & Ledger"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Adjust Physical Stock Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Quick Stock Count Audit</h3>
                <p className="text-xs text-slate-500">{adjustModalProduct.name} ({adjustModalProduct.sku})</p>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {adjustError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse Location *</label>
                <select
                  required
                  value={adjustForm.locationId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, locationId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Counted Quantity ({adjustModalProduct.uom}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={adjustForm.countedQty}
                  onChange={(e) => setAdjustForm({ ...adjustForm, countedQty: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  System will atomically recalculate variance and log an adjustment move.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="PHYSICAL_COUNT">Routine Physical Count Reconciliation</option>
                  <option value="DAMAGED">Damaged / Broken in Transit</option>
                  <option value="EXPIRED">Perished / Expired Shelf Stock</option>
                  <option value="SHRINKAGE">Shrinkage / Loss</option>
                  <option value="CORRECTION">Data Entry Correction</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-98 transition-all disabled:opacity-50"
                >
                  {adjustLoading ? 'Updating...' : 'Commit Stock Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">Add New Master Product SKU</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Pure Ghee 1L Tin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GHEE-1L-AMUL"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="299.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ltr">Litres (ltr)</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (High-res Product Photo)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Alert Point</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Intake</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {Number(formData.initialStock) > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Intake Warehouse Location *</label>
                  <select
                    required
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isVisibleOnStore"
                  checked={formData.isVisibleOnStore}
                  onChange={(e) => setFormData({ ...formData, isVisibleOnStore: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isVisibleOnStore" className="text-xs font-bold text-slate-700">
                  Publish to Customer Quick-Commerce Storefront
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/25 active:scale-98 transition-all"
                >
                  Save Product Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCategoryForm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">New Category</h2>
              <button onClick={() => setShowCategoryForm(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy & Breakfast"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
