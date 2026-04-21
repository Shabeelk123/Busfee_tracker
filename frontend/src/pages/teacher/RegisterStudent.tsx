import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface Bus { id: string; bus_number: string; route: string; monthly_fee: number; }

export default function RegisterStudent() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [form, setForm] = useState({ name: '', roll_no: '', bus_id: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/teacher/buses').then(r => setBuses(r.data.buses)).catch(console.error);
  }, []);

  const selectedBus = buses.find(b => b.id === form.bus_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/teacher/students', form);
      toast.success(`${form.name} registered successfully!`);
      navigate('/teacher/students');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => navigate('/teacher/students')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Students
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Register Student</h1>
        <p className="text-gray-400 mt-1">Add a new student to your class</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {/* Student Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Student Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm text-gray-400 mb-1.5 block">Full Name *</label>
              <input className="input-field" placeholder="Student Full Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm text-gray-400 mb-1.5 block">Roll Number *</label>
              <input className="input-field" placeholder="e.g. 01, 02..." value={form.roll_no}
                onChange={e => setForm({ ...form, roll_no: e.target.value })} required />
            </div>
          </div>
        </div>

        {/* Bus Assignment */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Bus Assignment</h2>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Assign to Bus</label>
            <select className="input-field" value={form.bus_id} onChange={e => setForm({ ...form, bus_id: e.target.value })}>
              <option value="">-- No Bus (Day Scholar) --</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number} — {b.route} (₹{b.monthly_fee}/mo)</option>)}
            </select>
          </div>
          {selectedBus && (
            <div className="mt-3 bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-gold-400">{selectedBus.bus_number}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selectedBus.route}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-gold-400 font-bold">₹{selectedBus.monthly_fee.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
            </div>
          )}
        </div>

        {/* Login Credentials */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Student Login Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email Address *</label>
              <input className="input-field" type="email" placeholder="student@school.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password *</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={() => navigate('/teacher/students')} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <><div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />Registering...</> : <><UserPlus className="w-4 h-4" />Register Student</>}
          </button>
        </div>
      </form>
    </div>
  );
}
