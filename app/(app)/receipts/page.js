'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReceiptsContent() {
  const searchParams = useSearchParams();
  const urlSupplierId = searchParams.get('supplierId') || '';
  const urlProductId = searchParams.get('productId') || '';
  const urlSearch = searchParams.get('search') || '';

  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validatingId, setValidatingId] = useState(null);

  // New receipt form state
  const [formData, setFormData] = useState({
    supplierId: urlSupplierId,
    locationId: '',
    notes: '',
    lines: [{ productId: urlProductId, quantity: 10, uom: 'pcs' }],
  });

  const fetchReceipts = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/receipts?${params}`)
      .then((r) => r.json())
      .then((d) => setReceipts(d.receipts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReceipts();
    fetch('/api/suppliers').then((r) => r.json()).then((d) => {
      setSuppliers(d.suppliers || []);
      if (urlSupplierId) {
        setFormData((prev) => ({ ...prev, supplierId: urlSupplierId }));
        setShowModal(true);
      }
    });
    fetch('/api/locations').then((r) => r.json()).then((d) => {
      const locs = d.locations || [];
      setLocations(locs);
      if (locs.length > 0 && !formData.locationId) {
        setFormData((prev) => ({ ...prev, locationId: locs[0].id }));
      }
    });
    fetch('/api/products').then((r) => r.json()).then((d) => {
      const prods = d.products || [];
      setProducts(prods);
      if (urlProductId) {
        const found = prods.find((p) => p.id === urlProductId);
        if (found) {
          setFormData((prev) => ({
            ...prev,
            lines: [{ productId: found.id, quantity: Math.max(10, found.reorderPoint || 10), uom: found.uom }],
          }));
          setShowModal(true);
        }
      }
    });
  }, [search, statusFilter]);

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', quantity: 1, uom: 'pcs' }],
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length === 1) return;
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index, field, value) => {
    const updated = [...formData.lines];
    updated[index][field] = value;
    if (field === 'productId') {
      const selected = products.find((p) => p.id === value);
      if (selected) updated[index].uom = selected.uom;
    }
    setFormData({ ...formData, lines: updated });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.lines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      setError('Please select a valid product and positive quantity for all lines');
      return;
    }

    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create receipt');
        return;
      }

      setSuccess(`Receipt ${data.receipt.reference} created! Validate it to commit stock.`);
      setShowModal(false);
      setFormData({
        supplierId: '',
        locationId: locations[0]?.id || '',
        notes: '',
        lines: [{ productId: '', quantity: 1, uom: 'pcs' }],
      });
      fetchReceipts();
    } catch {
      setError('Something went wrong');
    }
  };

  const handleValidate = async (id, ref) => {
    setError('');
    setSuccess('');
    setValidatingId(id);

    try {
      const res = await fetch(`/api/receipts/${id}/validate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to validate receipt');
        return;
      }

      setSuccess(`Receipt ${ref} validated! Stock increased in warehouse.`);
      fetchReceipts();
    } catch {
      setError('Validation error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Reference', 'Supplier', 'Destination Location', 'Total Items', 'Status', 'Date', 'Created By'];
    const rows = receipts.map((r) => [
      `"${r.reference}"`,
      `"${r.supplier?.name || 'Walk-in Vendor'}"`,
      `"${r.location?.name || ''}"`,
      r.lines.reduce((s, l) => s + l.quantity, 0),
      r.status,
      `"${new Date(r.createdAt).toISOString()}"`,
      `"${r.creator?.name || 'System'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadges = {
    DRAFT: 'badge-draft',
    WAITING: 'badge-waiting',
    READY: 'badge-ready',
    DONE: 'badge-done',
    CANCELED: 'badge-canceled',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inbound Receipts (Procurement Intake)</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Receive purchase orders and shipments from suppliers directly into warehouse locations
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Inbound Receipt
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold animate-fade-in flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold animate-fade-in flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: '', label: 'All Receipts' },
          { key: 'READY', label: 'Ready for Intake' },
          { key: 'DRAFT', label: 'Drafts' },
          { key: 'DONE', label: 'Validated & Stocked' },
          { key: 'CANCELED', label: 'Canceled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.key
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by receipt reference (e.g. REC-2026-001) or supplier name..."
          className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
        />
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Loading receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📥</div>
            <p className="text-slate-800 font-bold text-base">No receipts found</p>
            <p className="text-xs text-slate-400 mt-1">Create an inbound receipt to record vendor deliveries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-6 py-3.5">Supplier / Vendor</th>
                  <th className="px-4 py-3.5">Destination Hub</th>
                  <th className="px-6 py-3.5">Stock Items</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5">Recorded By</th>
                  <th className="px-6 py-3.5 text-right">Intake Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">
                      {r.reference}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.supplier?.name || 'Direct Procurement'}</p>
                      {r.supplier?.phone && (
                        <p className="text-[11px] text-slate-400 font-mono">{r.supplier.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-semibold">{r.location?.name}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {r.lines.map((l, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{l.product.name}</span>:
                            <span className="font-black text-emerald-600">+{l.quantity} {l.uom}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`badge ${statusBadges[r.status] || 'badge-draft'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 font-medium">{r.creator.name}</td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'DONE' && r.status !== 'CANCELED' ? (
                        <button
                          onClick={() => handleValidate(r.id, r.reference)}
                          disabled={validatingId === r.id}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {validatingId === r.id ? 'Stocking...' : 'Validate & Receive'}
                        </button>
                      ) : r.status === 'DONE' ? (
                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Received & Stocked
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">New Inbound Stock Receipt</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Walk-in / Direct Vendor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Warehouse *</label>
                  <select
                    required
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Select Warehouse</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Lines */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Receipt Line Items *</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    + Add Item
                  </button>
                </div>

                {formData.lines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <select
                        required
                        value={line.productId}
                        onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        required
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <span className="text-xs font-mono text-slate-500 w-10">{line.uom}</span>

                    {formData.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200/50 rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Notes / PO Reference</label>
                <textarea
                  rows={2}
                  placeholder="PO #, invoice reference, batch details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-98 transition-all"
                >
                  Create Inbound Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading receipts...</div>}>
      <ReceiptsContent />
    </Suspense>
  );
}
