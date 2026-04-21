import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, X, Eye, EyeOff } from 'lucide-react';

interface Class { id: string; name: string; section: string; }
interface Teacher { id: string; name: string; email: string; class: Class | null; }

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', class_id: '' });

  const fetchData = async () => {
    try {
      const [tch, cls] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/classes')]);
      setTeachers(tch.data.teachers); setClasses(cls.data.classes);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/teachers', form);
      toast.success('Teacher account created'); setModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    try { await api.delete(`/admin/teachers/${id}`); toast.success('Teacher deleted'); fetchData(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Teachers</h1>
          <p className="text-gray-400 mt-1">Create and manage teacher accounts</p>
        </div>
        <button onClick={() => { setForm({ name:'',email:'',password:'',class_id:'' }); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Teacher</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Teacher</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Assigned Class</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-400 font-bold text-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {t.class
                      ? <span className="bg-sky-400/10 text-sky-400 border border-sky-400/20 text-xs px-2.5 py-1 rounded-full font-medium">{t.class.name} {t.class.section}</span>
                      : <span className="text-gray-500 text-xs">Not assigned</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No teachers yet.</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Add Teacher</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Full Name *</label>
                <input className="input-field" placeholder="Teacher Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Email *</label>
                <input className="input-field" type="email" placeholder="teacher@school.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Password *</label>
                <div className="relative">
                  <input className="input-field pr-10" type={showPwd ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Assign to Class</label>
                <select className="input-field" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">-- Assign Later --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
