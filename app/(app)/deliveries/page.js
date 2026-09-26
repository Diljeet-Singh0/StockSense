'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DeliveriesContent() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source') || '';

  const [deliveries, setDeliveries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState(initialSource);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    locationId: '',
    notes: '',
    lines: [{ productId: '', quantity: 1 }],
  });

  const fetchDeliveries = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (sourceFilter) params.set('source', sourceFilter);

    fetch(`/api/deliveries?${params}`)
      .then((r) => r.json())
      .then((d) => setDeliveries(d.deliveries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeliveries();
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, [search, statusFilter, sourceFilter]);

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

    if (formData.lines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      setError('Please select a valid product and positive quantity for all items');
      return;
    }

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create delivery order');
        return;
      }

      setSuccess(`Delivery Order ${data.delivery.reference} created!`);
      setShowModal(false);
      setFormData({
        customerName: '',
        locationId: '',
        notes: '',
        lines: [{ productId: '', quantity: 1 }],
      });
      fetchDeliveries();
    } catch {
      setError('Something went wrong');
    }
  };

  const handleValidate = async (id, ref) => {
    setError('');
    setSuccess('');
    setActionLoadingId(id);

    try {
      const res = await fetch(`/api/deliveries/${id}/validate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to validate delivery order');
        return;
      }

      setSuccess(`Delivery ${ref} validated! Stock reduced successfully.`);
      fetchDeliveries();
    } catch {
      setError('Validation error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (id, newStatus, custStatus) => {
    setError('');
    setSuccess('');
    setActionLoadingId(id);

    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          customerOrderStatus: custStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update status');
        return;
      }

      setSuccess(data.message || 'Status updated successfully');
      fetchDeliveries();
    } catch {
      setError('Error updating delivery status');
    } finally {
      setActionLoadingId(null);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Orders & Outbound Fulfillment</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Pack, validate, and dispatch customer storefront orders (COD) & manual warehouse shipments
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const headers = ['Order Ref', 'Source', 'Customer', 'Hub', 'Items', 'Status', 'Date'];
              const rows = deliveries.map((d) => [
                `"${d.reference}"`,
                d.source,
                `"${d.customerName}"`,
                `"${d.location?.name || ''}"`,
                d.lines.reduce((s, l) => s + l.quantity, 0),
                d.status,
                `"${new Date(d.createdAt).toISOString()}"`,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `stocksense_deliveries_${new Date().toISOString().split('T')[0]}.csv`);
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Manual Delivery
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All Dispatches', source: '', status: '' },
          { label: '🛒 Store Customer Orders (COD)', source: 'CUSTOMER_ORDER', status: '' },
          { label: '📦 Manual Warehouse Shipments', source: 'MANUAL', status: '' },
          { label: 'Ready to Pack / Ship', source: '', status: 'READY' },
          { label: 'Completed / Delivered', source: '', status: 'DONE' },
        ].map((tab, idx) => {
          const isActive = sourceFilter === tab.source && statusFilter === tab.status;
          return (
            <button
              key={idx}
              onClick={() => {
                setSourceFilter(tab.source);
                setStatusFilter(tab.status);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, customer, or phone..."
            className="w-full pl-3.5 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="">All Sources (Customer + Manual)</option>
            <option value="CUSTOMER_ORDER">🛒 Customer Storefront (COD Only)</option>
            <option value="MANUAL">📦 Manual Inventory Dispatches</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done / Delivered</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📤</div>
            <p className="text-slate-500 font-medium">No delivery orders found</p>
            <p className="text-sm text-slate-400 mt-1">Customer storefront orders and manual dispatches appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Order Ref</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Source</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Fulfillment Hub</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Items</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Delivery Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((d) => {
                  const isCustomerOrder = d.source === 'CUSTOMER_ORDER';
                  const custStatus = d.customerOrder?.status;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 block">{d.reference}</span>
                        {d.customerOrder && (
                          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                            #{d.customerOrder.orderNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isCustomerOrder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span>🛒</span> Store COD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <span>📦</span> Manual
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-900">{d.customerName}</p>
                        {d.customerOrder?.customerPhone && (
                          <p className="text-[11px] text-slate-400 font-mono">{d.customerOrder.customerPhone}</p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                        {d.location?.name}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div className="space-y-1">
                          {d.lines.map((l, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold text-slate-800">{l.product.name}</span>: -{l.quantity} {l.product.uom}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className={`badge ${statusBadges[d.status] || 'badge-draft'}`}>{d.status}</span>
                          {custStatus && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Customer: {custStatus}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {d.status !== 'DONE' && d.status !== 'CANCELED' && (
                            <>
                              {isCustomerOrder && custStatus !== 'OUT_FOR_DELIVERY' && (
                                <button
                                  onClick={() => handleUpdateStatus(d.id, d.status, 'OUT_FOR_DELIVERY')}
                                  disabled={actionLoadingId === d.id}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold"
                                >
                                  Dispatch
                                </button>
                              )}

                              <button
                                onClick={() => handleValidate(d.id, d.reference)}
                                disabled={actionLoadingId === d.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                              >
                                {actionLoadingId === d.id ? 'Saving...' : 'Validate (Done)'}
                              </button>

                              <button
                                onClick={() => handleUpdateStatus(d.id, 'CANCELED', 'CANCELED')}
                                disabled={actionLoadingId === d.id}
                                title="Cancel and restore stock"
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {d.status === 'DONE' && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <span>✓</span> Shipped
                            </span>
                          )}

                          {d.status === 'CANCELED' && (
                            <span className="text-xs text-slate-400 font-medium">Canceled & Restocked</span>
                          )}
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

      {/* New Manual Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Manual Delivery Order</h2>
                <p className="text-xs text-slate-500">Dispatch stock for wholesale / B2B client</p>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="e.g. Apex Industrial Works"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source Location *</label>
                  <select
                    required
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Items to Deliver *</span>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Courier consignment number, gate pass..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
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
                  className="px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  Save Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading deliveries...</div>}>
      <DeliveriesContent />
    </Suspense>
  );
}
