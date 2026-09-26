'use client';

import { useState, useEffect } from 'react';

export default function WarehousesPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLocations = () => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, parentId: parentId || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create warehouse');
        return;
      }

      setSuccess(`Warehouse/Location ${data.location.name} added successfully!`);
      setName('');
      setCode('');
      setParentId('');
      setShowModal(false);
      fetchLocations();
    } catch {
      setError('Something went wrong');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouses & Internal Locations</h1>
          <p className="text-slate-500 mt-1">Manage physical warehouses, distribution bays, and internal storage racks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
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

      {/* Locations List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : locations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-slate-500 font-medium">No locations configured yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Location Name</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Unique Code</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Parent Location</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => {
                  const parent = locations.find((p) => p.id === loc.parentId);
                  return (
                    <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900 text-sm">{loc.name}</td>
                      <td className="px-6 py-3.5 font-mono text-sm text-indigo-600">{loc.code}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{parent ? parent.name : '— Root / Main'}</td>
                      <td className="px-6 py-3.5">
                        <span className="badge badge-done">Active</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-right text-slate-400">
                        {new Date(loc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Warehouse / Location</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Hub Warehouse, Rack C"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code / Identifier *</label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WH-NORTH, LOC-RACK-C"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Location (Optional)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None (Top-level warehouse)</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
