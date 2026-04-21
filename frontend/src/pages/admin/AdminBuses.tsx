import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Bus as BusIcon, X } from 'lucide-react';

interface Bus { id: string; bus_number: string; route: string; monthly_fee: number; students: [{ count: number }]; }

export default function AdminBuses() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState({ bus_number: '', route: '', monthly_fee: '' });

  const fetchBuses = async () => {
    try { const res = await api.get('/admin/buses'); setBuses(res.data.buses); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchBuses(); }, []);

  const openModal = (bus?: Bus) => {
    if (bus) { setEditing(bus); setForm({ bus_number: bus.bus_number, route: bus.route, monthly_fee: String(bus.monthly_fee) }); }
    else { setEditing(null); setForm({ bus_number: '', route: '', monthly_fee: '' }); }
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, monthly_fee: parseFloat(form.monthly_fee) };
    try {
      if (editing) { await api.put(`/admin/buses/${editing.id}`, payload); toast.success('Bus updated'); }
      else { await api.post('/admin/buses', payload); toast.success('Bus added'); }
      setModal(false); fetchBuses();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bus?')) return;
    try { await api.delete(`/admin/buses/${id}`); toast.success('Bus deleted'); fetchBuses(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Buses</h1>
          <p className="text-gray-400 mt-1">Manage school buses, routes and fees</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Add Bus</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map(bus => (
            <div key={bus.id} className="glass-card p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <BusIcon className="w-6 h-6 text-gold-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(bus)} className="text-gray-500 hover:text-gold-400 transition-colors p-1 text-sm">Edit</button>
                  <button onClick={() => handleDelete(bus.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">{bus.bus_number}</h3>
              <p className="text-sm text-gray-400 mt-1">🗺️ {bus.route || 'No route set'}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500">{(bus.students as any)?.[0]?.count || 0} students</span>
                <span className="text-gold-400 font-bold">₹{bus.monthly_fee.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-normal">/mo</span></span>
              </div>
            </div>
          ))}
          {buses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <BusIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No buses yet. Add your first bus!</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Bus' : 'Add Bus'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Bus Number *</label>
                <input className="input-field" placeholder="e.g. Bus 01" value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Route</label>
                <input className="input-field" placeholder="e.g. Main Street → School" value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Monthly Fee (₹) *</label>
                <input className="input-field" type="number" min="0" placeholder="e.g. 1500" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{editing ? 'Update' : 'Add Bus'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
