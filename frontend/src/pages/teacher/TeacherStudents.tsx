import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { GraduationCap, UserPlus } from 'lucide-react';

interface Student {
  id: string; name: string; roll_no: string;
  bus: { bus_number: string; monthly_fee: number } | null;
  profile: { email: string } | null;
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/students').then(r => setStudents(r.data.students)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Students</h1>
          <p className="text-gray-400 mt-1">Students in your class</p>
        </div>
        <Link to="/teacher/students/register" className="btn-primary shrink-0"><UserPlus className="w-4 h-4" />Register Student</Link>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5">
                {['Student', 'Roll No', 'Bus', 'Monthly Fee', 'Fee Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 font-bold text-sm">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.profile?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{s.roll_no}</td>
                  <td className="px-6 py-4">
                    {s.bus ? <span className="bg-gold-400/10 text-gold-400 text-xs px-2.5 py-1 rounded-full border border-gold-400/20">{s.bus.bus_number}</span>
                      : <span className="text-gray-600 text-xs">No bus</span>}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {s.bus ? `₹${s.bus.monthly_fee.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/teacher/fees/${s.id}`} className="text-xs bg-navy-700 hover:bg-navy-600 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition-colors inline-block">
                      Manage Fees →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No students registered yet.</p>
              <Link to="/teacher/students/register" className="text-gold-400 text-sm mt-2 inline-block hover:underline">Register your first student →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
