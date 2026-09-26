'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSuppliers = () => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => setSuppliers(data.suppliers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const url = '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      const payload = editingSupplier ? { ...form, id: editingSupplier.id } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save supplier');
        return;
      }

      setSuccess(editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully');
      setShowModal(false);
      fetchSuppliers();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete supplier');
        return;
      }
      setSuccess(`Supplier "${name}" deleted`);
      fetchSuppliers();
    } catch {
      setError('Failed to delete supplier');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  const totalReceipts = suppliers.reduce((sum, s) => sum + (s._count?.receipts || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suppliers & Vendors</h1>
          <p className="text-slate-500 mt-1">Manage vendor contacts, procurement sources, and inbound supply chains</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Supplier
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            🏢
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Vendors</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{suppliers.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            📥
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inbound Receipts</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalReceipts}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            📦
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Procurement</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {suppliers.filter((s) => (s._count?.receipts || 0) > 0).length} Active
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers by company name, email, phone, or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-slate-500 mt-2">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-slate-700 font-semibold">No suppliers found</p>
            <p className="text-sm text-slate-400 mt-1">Add your vendor partners to start receiving stock shipments</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100"
            >
              + Register First Supplier
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor / Company</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location / Address</th>
                  <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Inbound Orders</th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {supplier.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{supplier.name}</p>
                          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Active Vendor
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="text-indigo-600 hover:underline flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {supplier.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No email provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {supplier.phone ? (
                        <a href={`tel:${supplier.phone}`} className="text-slate-700 hover:text-indigo-600 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {supplier.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {supplier.address || <span className="text-slate-400 italic">Not set</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/receipts?search=${encodeURIComponent(supplier.name)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="View receipts from this supplier"
                      >
                        <span>📥</span>
                        <span>{supplier._count?.receipts || 0} Receipts</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/receipts?supplierId=${supplier.id}`}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                          title="New Receipt from this vendor"
                        >
                          + Receive
                        </Link>
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit supplier details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Delete supplier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingSupplier ? 'Edit Supplier' : 'Register New Vendor / Supplier'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Wholesale Supplies"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office / Warehouse Address</label>
                <textarea
                  rows={2}
                  placeholder="Plot 42, Logistics Park, Industrial Area..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-98 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
