import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Search, GraduationCap } from 'lucide-react';

interface Student {
  id: string; name: string; roll_no: string;
  class: { name: string; section: string } | null;
  bus: { bus_number: string; monthly_fee: number } | null;
  profile: { email: string } | null;
}
interface Class { id: string; name: string; section: string; }
interface Bus { id: string; bus_number: string; }

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterBus, setFilterBus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filterClass) params.set('class_id', filterClass);
        if (filterBus) params.set('bus_id', filterBus);
        const [stuRes, cls, bus] = await Promise.all([
          api.get(`/admin/students?${params}`),
          api.get('/admin/classes'),
          api.get('/admin/buses'),
        ]);
        setStudents(stuRes.data.students);
        setClasses(cls.data.classes);
        setBuses(bus.data.buses);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [filterClass, filterBus]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Students</h1>
        <p className="text-gray-400 mt-1">View and filter all enrolled students</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input-field pl-9" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-44" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select>
        <select className="input-field w-44" value={filterBus} onChange={e => setFilterBus(e.target.value)}>
          <option value="">All Buses</option>
          {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-3 border-b border-white/5 text-xs text-gray-500">{filtered.length} students</div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Student', 'Roll No', 'Class', 'Bus', 'Monthly Fee', 'Login'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{s.roll_no}</td>
                  <td className="px-6 py-4">
                    {s.class ? <span className="bg-sky-400/10 text-sky-400 text-xs px-2 py-0.5 rounded-full">{s.class.name} {s.class.section}</span> : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {s.bus ? <span className="bg-gold-400/10 text-gold-400 text-xs px-2 py-0.5 rounded-full">{s.bus.bus_number}</span> : <span className="text-gray-600 text-xs">No bus</span>}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gold-400">
                    {s.bus ? `₹${s.bus.monthly_fee.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{s.profile?.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No students found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
