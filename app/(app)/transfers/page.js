'use client';

import { useState, useEffect } from 'react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validatingId, setValidatingId] = useState(null);

  const [formData, setFormData] = useState({
    sourceLocationId: '',
    destLocationId: '',
    lines: [{ productId: '', quantity: 1 }],
  });

  const fetchTransfers = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/transfers?${params}`)
      .then((r) => r.json())
      .then((d) => setTransfers(d.transfers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, [search, statusFilter]);

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', quantity: 1 }],
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
    setFormData({ ...formData, lines: updated });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.sourceLocationId === formData.destLocationId) {
      setError('Source and destination locations cannot be the same');
      return;
    }

    if (formData.lines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      setError('Please select a valid product and positive quantity for all items');
      return;
    }

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create transfer');
        return;
      }

      setSuccess(`Transfer ${data.transfer.reference} created!`);
      setShowModal(false);
      setFormData({
        sourceLocationId: '',
        destLocationId: '',
        lines: [{ productId: '', quantity: 1 }],
      });
      fetchTransfers();
    } catch {
      setError('Something went wrong');
    }
  };

  const handleValidate = async (id, ref) => {
    setError('');
    setSuccess('');
    setValidatingId(id);

    try {
      const res = await fetch(`/api/transfers/${id}/validate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to execute transfer');
        return;
      }

      setSuccess(`Transfer ${ref} validated! Quantities relocated across warehouses.`);
      fetchTransfers();
    } catch {
      setError('Transfer execution error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleCancel = async (id, ref) => {
    setError('');
    setSuccess('');
    const res = await fetch(`/api/transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELED' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to cancel transfer');
      return;
    }
    setSuccess(`Transfer ${ref} canceled before stock moved.`);
    fetchTransfers();
  };

  const statusBadges = {
    DRAFT: 'badge-draft',
    WAITING: 'badge-waiting',
    READY: 'badge-ready',
    DONE: 'badge-done',
    CANCELED: 'badge-canceled',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internal Transfers</h1>
          <p className="text-slate-500 mt-1">Move stock between warehouses, racks, and production zones</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const headers = ['Transfer Ref', 'Source Hub', 'Destination Hub', 'Items', 'Status', 'Date', 'Created By'];
              const rows = transfers.map((t) => [
                `"${t.reference}"`,
                `"${t.sourceLocation?.name || ''}"`,
                `"${t.destLocation?.name || ''}"`,
                t.lines.reduce((s, l) => s + l.quantity, 0),
                t.status,
                `"${new Date(t.createdAt).toISOString()}"`,
                `"${t.creator?.name || 'System'}"`,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `stocksense_transfers_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Internal Transfer
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transfer reference or location..."
            className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Statuses</option>
          <option value="READY">Ready</option>
          <option value="DONE">Done</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="text-slate-500 font-medium">No internal transfers found</p>
            <p className="text-sm text-slate-400 mt-1">Transfer materials between racks or storage rooms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Source Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Items Transferred</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Initiated By</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-indigo-600">{t.reference}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.sourceLocation?.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">→ {t.destLocation?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        {t.lines.map((l, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-slate-700">{l.product.name}</span>: {l.quantity} {l.product.uom}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusBadges[t.status] || 'badge-draft'}`}>{t.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{t.creator.name}</td>
                    <td className="px-6 py-4 text-right">
                      {t.status !== 'DONE' && t.status !== 'CANCELED' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleCancel(t.id, t.reference)}
                            className="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleValidate(t.id, t.reference)}
                            disabled={validatingId === t.id}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                          >
                            {validatingId === t.id ? 'Moving...' : 'Execute Transfer'}
                          </button>
                        </div>
                      ) : t.status === 'DONE' ? (
                        <span className="text-xs text-purple-600 font-semibold flex items-center justify-end gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Canceled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Initiate Internal Transfer</h2>
                <p className="text-xs text-slate-500">Relocate stock between inventory locations</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Location *</label>
                  <select
                    required
                    value={formData.sourceLocationId}
                    onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Source Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destination Location *</label>
                  <select
                    required
                    value={formData.destLocationId}
                    onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Destination Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Items to Transfer *</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    + Add Item
                  </button>
                </div>

                {formData.lines.map((line, idx) => {
                  const selectedProd = products.find((p) => p.id === line.productId);
                  return (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1">
                        <select
                          required
                          value={line.productId}
                          onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          required
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Quantity"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>

                      <div className="w-16 text-center text-xs font-semibold text-slate-500">
                        {selectedProd?.uom || 'units'}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={formData.lines.length === 1}
                        className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white font-medium text-sm rounded-xl hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  Create Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
