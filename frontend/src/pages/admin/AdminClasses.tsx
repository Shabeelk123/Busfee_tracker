import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, School, X } from 'lucide-react';

interface Teacher { id: string; name: string; email: string; }
interface Class { id: string; name: string; section: string; teacher: Teacher | null; students: [{ count: number }]; }

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState({ name: '', section: '', teacher_id: '' });

  const fetchData = async () => {
    try {
      const [cls, tch] = await Promise.all([api.get('/admin/classes'), api.get('/admin/teachers')]);
      setClasses(cls.data.classes); setTeachers(tch.data.teachers);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openModal = (cls?: Class) => {
    if (cls) { setEditing(cls); setForm({ name: cls.name, section: cls.section, teacher_id: cls.teacher?.id || '' }); }
    else { setEditing(null); setForm({ name: '', section: '', teacher_id: '' }); }
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/classes/${editing.id}`, form);
        toast.success('Class updated');
      } else {
        await api.post('/admin/classes', form);
        toast.success('Class created');
      }
      setModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class? All students will be removed.')) return;
    try { await api.delete(`/admin/classes/${id}`); toast.success('Class deleted'); fetchData(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Classes</h1>
          <p className="text-gray-400 mt-1">Manage school classes and assign teachers</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="glass-card p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center">
                  <School className="w-6 h-6 text-sky-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(cls)} className="text-gray-500 hover:text-gold-400 transition-colors p-1"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cls.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">{cls.name} {cls.section}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {cls.teacher ? `👤 ${cls.teacher.name}` : <span className="text-amber-500">No teacher assigned</span>}
              </p>
              <p className="text-xs text-gray-500 mt-2">{(cls.students as any)?.[0]?.count || 0} students</p>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-500">
              <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No classes yet. Add your first class!</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Class' : 'Add Class'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Class Name *</label>
                <input className="input-field" placeholder="e.g. Class 5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Section</label>
                <input className="input-field" placeholder="e.g. A, B, C" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Assign Teacher</label>
                <select className="input-field" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                  <option value="">-- No Teacher --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
