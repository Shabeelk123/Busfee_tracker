import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Bus, GraduationCap, CheckCircle, AlertCircle, LogOut, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACADEMIC_MONTHS = [
  { num: 6, name: 'Jun' }, { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' },
  { num: 9, name: 'Sep' }, { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' },
  { num: 12, name: 'Dec' }, { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' },
  { num: 3, name: 'Mar' },
];

interface StudentProfile {
  id: string;
  name: string;
  roll_no: string;
  email: string;
  class: { name: string; section: string } | null;
  bus: { bus_number: string; route: string; monthly_fee: number } | null;
}

interface FeeRecord {
  id: string;
  month: number;
  year: number;
  is_paid: boolean;
  paid_at: string | null;
  amount: number;
}

function getAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getAcademicYear());

  const academicYear = selectedYear;
  const academicLabel = `${academicYear}-${academicYear + 1}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, feeRes] = await Promise.all([
          api.get('/student/profile'),
          api.get(`/student/fees?year=${academicYear}`),
        ]);
        setStudent(profileRes.data.student);
        setFees(feeRes.data.fees || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selectedYear]);

  const paidCount = fees.filter(f => f.is_paid).length;
  const pendingCount = fees.filter(f => !f.is_paid).length;
  const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
  const paidAmount = fees.filter(f => f.is_paid).reduce((s, f) => s + f.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-navy-900">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-950 border-b border-white/5 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
              <Bus className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">BusFee Tracker</h1>
              <p className="text-xs text-sky-400 font-medium">Student Portal</p>
            </div>
          </div>
          <button
            id="student-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Welcome + Profile */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xl shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {student?.class && (
                    <span className="bg-sky-400/10 text-sky-400 border border-sky-400/20 text-xs px-2.5 py-1 rounded-full font-medium">
                      <GraduationCap className="w-3 h-3 inline mr-1" />
                      {student.class.name} {student.class.section}
                    </span>
                  )}
                  {student?.roll_no && (
                    <span className="bg-white/5 text-gray-400 border border-white/10 text-xs px-2.5 py-1 rounded-full">
                      Roll No: {student.roll_no}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {student?.bus ? (
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Assigned Bus</p>
                  <span className="bg-gold-500/10 text-gold-400 border border-gold-500/20 text-sm px-3 py-1.5 rounded-lg font-semibold inline-block">
                    <Bus className="w-3.5 h-3.5 inline mr-1.5" />
                    {student.bus.bus_number}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">₹{student.bus.monthly_fee.toLocaleString('en-IN')}/month</p>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Day Scholar</span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Paid Months', value: paidCount, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Pending Months', value: pendingCount, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
            { label: 'Amount Paid', value: `₹${paidAmount.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-gold-400', bg: 'bg-gold-400/10' },
            { label: 'Amount Due', value: `₹${pendingAmount.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fee Records */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-400" />
              <h2 className="text-base font-semibold text-white">Fee Records — {academicLabel}</h2>
            </div>
            <select
              className="input-field w-36 py-1.5 text-sm"
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}-{y + 1}</option>
              ))}
            </select>
          </div>

          {fees.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No fee records found for this year.</p>
              <p className="text-sm mt-1">Contact your teacher if this seems incorrect.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-0">
              {ACADEMIC_MONTHS.map(({ num, name }) => {
                // Academic year: Jun-Dec of academicYear, Jan-Mar of academicYear+1
                const feeYear = num >= 6 ? academicYear : academicYear + 1;
                const fee = fees.find(f => f.month === num && f.year === feeYear);
                return (
                  <div
                    key={num}
                    className={`p-4 border-b border-r border-white/5 flex flex-col gap-2 ${
                      fee?.is_paid ? 'bg-emerald-500/5' : fee ? 'bg-red-500/5' : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">{name}</span>
                      {fee ? (
                        <span className={fee.is_paid ? 'badge-paid' : 'badge-unpaid'}>
                          {fee.is_paid ? 'Paid' : 'Due'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </div>
                    {fee ? (
                      <p className={`text-sm font-bold ${fee.is_paid ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₹{fee.amount.toLocaleString('en-IN')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">₹0</p>
                    )}
                    {fee?.is_paid && fee.paid_at && (
                      <p className="text-xs text-gray-600">
                        {new Date(fee.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
