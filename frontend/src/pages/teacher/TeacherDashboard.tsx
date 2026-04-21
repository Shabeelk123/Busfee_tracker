import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { GraduationCap, CheckCircle, XCircle, UserPlus } from 'lucide-react';

export default function TeacherDashboard() {
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/class-info')
      .then(res => setClassInfo(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!classInfo) return (
    <div className="p-8 text-center text-gray-500 mt-20">
      <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p className="text-lg">You are not assigned to any class yet.</p>
      <p className="text-sm mt-2">Please ask the admin to assign you to a class.</p>
    </div>
  );

  const { class: cls, stats } = classInfo;
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{cls.name} {cls.section}</h1>
        <p className="text-gray-400 mt-1">Fee status for {monthName} {now.getFullYear()}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: stats.total_students, icon: GraduationCap, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Paid This Month', value: stats.paid_this_month, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Pending', value: stats.unpaid_this_month, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
            <div><p className="text-2xl font-bold text-white">{s.value}</p><p className="text-sm text-gray-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Collection progress bar */}
      <div className="glass-card p-6">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-400">Collection Rate — {monthName}</span>
          <span className="text-gold-400 font-bold">{stats.collection_rate}%</span>
        </div>
        <div className="w-full bg-navy-800 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-700"
            style={{ width: `${stats.collection_rate}%` }} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-4">
        <Link to="/teacher/students" className="btn-primary"><GraduationCap className="w-4 h-4" />View Students</Link>
        <Link to="/teacher/students/register" className="btn-secondary"><UserPlus className="w-4 h-4" />Register Student</Link>
      </div>
    </div>
  );
}
