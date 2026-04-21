import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Users, Bus, School, GraduationCap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Summary {
  total: number; paid: number; unpaid: number;
  collection_rate: number; total_amount: number; paid_amount: number; pending_amount: number;
}

function getAcademicYear() {
  const now = new Date();
  return now.getMonth() + 1 >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [counts, setCounts] = useState({ classes: 0, teachers: 0, buses: 0, students: 0 });
  const [loading, setLoading] = useState(true);
  const academicYear = getAcademicYear();
  const academicLabel = `${academicYear}-${academicYear + 1}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, classRes, teacherRes, busRes, studRes] = await Promise.all([
          api.get(`/admin/fees/summary?year=${academicYear}`),
          api.get('/admin/classes'),
          api.get('/admin/teachers'),
          api.get('/admin/buses'),
          api.get('/admin/students'),
        ]);
        setSummary(sumRes.data.summary);
        setCounts({
          classes: classRes.data.classes.length,
          teachers: teacherRes.data.teachers.length,
          buses: busRes.data.buses.length,
          students: studRes.data.students.length,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Classes', value: counts.classes, icon: School, color: 'text-sky-400', bg: 'bg-sky-400/10', link: '/admin/classes' },
    { label: 'Teachers', value: counts.teachers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', link: '/admin/teachers' },
    { label: 'Buses', value: counts.buses, icon: Bus, color: 'text-gold-400', bg: 'bg-gold-400/10', link: '/admin/buses' },
    { label: 'Students', value: counts.students, icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10', link: '/admin/students' },
  ];

  if (loading) return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview for Academic Year {academicLabel}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} to={s.link} id={`stat-card-${s.label.toLowerCase().replace(/\s+/g, '-')}`} className="stat-card hover:border-white/20 transition-colors group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white group-hover:text-gold-400 transition-colors">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Fee Collection */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Collection Rate */}
        <div className="glass-card p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-5">Collection Rate</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f5a623" strokeWidth="12"
                  strokeDasharray={`${(summary?.collection_rate || 0) * 3.14} 314`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gold-400">{summary?.collection_rate || 0}%</span>
                <span className="text-xs text-gray-500">Collected</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div className="text-center"><div className="text-emerald-400 font-bold">{summary?.paid}</div><div className="text-gray-500">Paid</div></div>
            <div className="text-center"><div className="text-red-400 font-bold">{summary?.unpaid}</div><div className="text-gray-500">Pending</div></div>
            <div className="text-center"><div className="text-white font-bold">{summary?.total}</div><div className="text-gray-500">Total</div></div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-5">Fee Summary ({academicLabel})</h2>
          <div className="space-y-4">
            {[
              { label: 'Total Expected', amount: summary?.total_amount || 0, icon: TrendingUp, color: 'text-gray-300' },
              { label: 'Amount Collected', amount: summary?.paid_amount || 0, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Pending Amount', amount: summary?.pending_amount || 0, icon: AlertCircle, color: 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4 p-4 bg-navy-800 rounded-xl">
                <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
                <p className={`text-lg font-bold ${item.color}`}>
                  ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Add New Class', to: '/admin/classes' },
            { label: 'Add Teacher', to: '/admin/teachers' },
            { label: 'Add Bus', to: '/admin/buses' },
            { label: 'View All Students', to: '/admin/students' },
            { label: 'Fee Reports', to: '/admin/reports' },
          ].map(a => (
            <Link key={a.label} to={a.to} className="btn-secondary justify-center py-3 text-sm">
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
