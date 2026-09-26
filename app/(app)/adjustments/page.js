'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdjustmentsContent() {
  const searchParams = useSearchParams();
  const preselectProductId = searchParams.get('productId') || '';

  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    productId: preselectProductId,
    locationId: '',
    countedQty: '',
    reason: 'Routine physical inventory audit',
  });

  const [currentSystemQty, setCurrentSystemQty] = useState(null);

  const fetchAdjustments = () => {
    fetch('/api/adjustments')
      .then((r) => r.json())
      .then((d) => setAdjustments(d.adjustments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdjustments();
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
    fetch('/api/products').then((r) => r.json()).then((d) => {
      setProducts(d.products || []);
      if (preselectProductId) {
        setShowModal(true);
      }
    });
  }, [preselectProductId]);

  // When product and location change, fetch current recorded stock level
  useEffect(() => {
    if (!form.productId || !form.locationId) {
      setCurrentSystemQty(null);
      return;
    }

    const prod = products.find((p) => p.id === form.productId);
    if (prod && prod.stockLevels) {
      const level = prod.stockLevels.find((sl) => sl.locationId === form.locationId);
      setCurrentSystemQty(level ? Number(level.quantity) : 0);
    } else {
      setCurrentSystemQty(0);
    }
  }, [form.productId, form.locationId, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          locationId: form.locationId,
          countedQty: parseFloat(form.countedQty),
          reason: form.reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit adjustment');
        return;
      }

      setSuccess(`Adjustment recorded! Stock updated by ${data.adjustment.difference > 0 ? '+' : ''}${data.adjustment.difference}.`);
      setShowModal(false);
      setForm({
        productId: '',
        locationId: '',
        countedQty: '',
        reason: 'Routine physical inventory audit',
      });
      fetchAdjustments();
      // refresh products so stock levels stay accurate
      fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
    } catch {
      setError('Something went wrong');
    }
  };

  const selectedProd = products.find((p) => p.id === form.productId);
  const diff = form.countedQty !== '' && currentSystemQty !== null
    ? parseFloat(form.countedQty) - currentSystemQty
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text-slate-500 mt-1">Reconcile physical inventory counts with recorded system quantities</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const headers = ['Date', 'Product', 'SKU', 'Location', 'Previous Qty', 'Counted Qty', 'Variance (Delta)', 'Reason', 'Operator'];
              const rows = adjustments.map((a) => [
                `"${new Date(a.createdAt).toISOString()}"`,
                `"${a.product?.name?.replace(/"/g, '""') || ''}"`,
                `"${a.product?.sku || ''}"`,
                `"${a.location?.name || ''}"`,
                a.previousQty,
                a.countedQty,
                a.difference,
                `"${a.reason?.replace(/"/g, '""') || ''}"`,
                `"${a.creator?.name || 'System'}"`,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `stocksense_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Stock Count
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

      {/* Adjustments History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Adjustment Audit Trail</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-slate-500 font-medium">No stock adjustments recorded</p>
            <p className="text-sm text-slate-400 mt-1">Perform physical count reconciliations whenever discrepancies arise.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Location</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Previous System Qty</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Physical Count</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Adjustment Delta</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Counted By</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-slate-900">{a.product.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.product.sku}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{a.location.name}</td>
                    <td className="px-6 py-3.5 text-sm text-right text-slate-500">{a.previousQty} {a.product.uom}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-right text-slate-900">{a.countedQty} {a.product.uom}</td>
                    <td className={`px-6 py-3.5 text-sm font-extrabold text-right ${a.difference > 0 ? 'text-emerald-600' : a.difference < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {a.difference > 0 ? '+' : ''}{a.difference} {a.product.uom}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">{a.reason || 'Count correction'}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{a.creator.name}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Physical Count</h2>
                <p className="text-xs text-slate-500">Correct inventory mismatches</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Product to Adjust</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse / Location *</label>
                <select
                  required
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              {currentSystemQty !== null && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
                  <span className="text-slate-600">Current Recorded Stock:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {currentSystemQty} {selectedProd?.uom}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Physical Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  value={form.countedQty}
                  onChange={(e) => setForm({ ...form, countedQty: e.target.value })}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {diff !== null && !isNaN(diff) && (
                <div className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between ${diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : diff < 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span>Computed Adjustment:</span>
                  <span>{diff > 0 ? `+${diff}` : diff} {selectedProd?.uom}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Adjustment</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Routine physical inventory audit">Routine physical inventory audit</option>
                  <option value="Damaged / broken goods removed">Damaged / broken goods removed</option>
                  <option value="Expired inventory discarded">Expired inventory discarded</option>
                  <option value="Found extra unrecorded stock">Found extra unrecorded stock</option>
                  <option value="Theft or shrinkage write-off">Theft or shrinkage write-off</option>
                  <option value="Initial stock calibration">Initial stock calibration</option>
                </select>
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
                  className="px-5 py-2 bg-amber-600 text-white font-medium text-sm rounded-xl hover:bg-amber-700 shadow-md shadow-amber-600/20"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdjustmentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading adjustments...</div>}>
      <AdjustmentsContent />
    </Suspense>
  );
}
