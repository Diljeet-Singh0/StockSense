'use client';

import { useState, useEffect } from 'react';

const moveTypeBadges = {
  RECEIPT: { label: 'Receipt In', class: 'badge-done' },
  DELIVERY: { label: 'Delivery Out', class: 'badge-canceled' },
  TRANSFER_IN: { label: 'Transfer In', class: 'badge-ready' },
  TRANSFER_OUT: { label: 'Transfer Out', class: 'badge-waiting' },
  ADJUSTMENT: { label: 'Audit Adjustment', class: 'badge-draft' },
};

export default function HistoryPage() {
  const [moves, setMoves] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const fetchHistory = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterType) params.set('moveType', filterType);
    if (filterLocation) params.set('locationId', filterLocation);
    if (filterProduct) params.set('productId', filterProduct);

    fetch(`/api/history?${params}`)
      .then((r) => r.json())
      .then((d) => setMoves(d.moves || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || []));
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, [search, filterType, filterLocation, filterProduct]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Product Name', 'SKU', 'Location', 'Operation Type', 'Quantity Delta', 'Operator'];
    const rows = moves.map((m) => [
      `"${new Date(m.createdAt).toISOString()}"`,
      `"${m.product?.name?.replace(/"/g, '""') || ''}"`,
      `"${m.product?.sku || ''}"`,
      `"${m.location?.name || ''}"`,
      m.moveType,
      m.quantityChange,
      `"${m.creator?.name || 'System'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Ledger & Audit Trail</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Immutable, append-only chronological log of all stock increments, decrements, and relocations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 shadow-sm transition-all"
        >
          <span>📥</span>
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Quick Type Chips */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: '', label: 'All Operations' },
          { key: 'RECEIPT', label: 'Inbound Receipts' },
          { key: 'DELIVERY', label: 'Outbound Deliveries' },
          { key: 'TRANSFER_IN', label: 'Transfers' },
          { key: 'ADJUSTMENT', label: 'Physical Adjustments' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or SKU..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="">All Warehouse Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="">All Catalog Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Querying ledger records...</p>
          </div>
        ) : moves.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-slate-800 font-bold text-base">No stock moves recorded matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">Transactions will be recorded here automatically when validated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Product & SKU</th>
                  <th className="px-4 py-3.5">Warehouse Location</th>
                  <th className="px-4 py-3.5">Movement Type</th>
                  <th className="px-6 py-3.5 text-right">Quantity Delta</th>
                  <th className="px-6 py-3.5 text-right">Responsible User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {moves.map((m) => {
                  const badgeInfo = moveTypeBadges[m.moveType] || { label: m.moveType, class: 'badge-draft' };
                  const qty = Number(m.quantityChange);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{m.product.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{m.product.sku}</p>
                      </td>

                      <td className="px-4 py-4 text-slate-700 font-semibold">{m.location.name}</td>

                      <td className="px-4 py-4">
                        <span className={`badge ${badgeInfo.class}`}>{badgeInfo.label}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-black text-sm ${
                            qty > 0 ? 'text-emerald-600' : qty < 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {qty > 0 ? `+${qty}` : qty} {m.product.uom}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-slate-600 font-medium">
                        {m.creator.name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
