import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Bus, CheckCircle, XCircle, Calendar } from 'lucide-react';

const ACADEMIC_MONTHS = [
  { num: 6, name: 'June' }, { num: 7, name: 'July' }, { num: 8, name: 'August' },
  { num: 9, name: 'September' }, { num: 10, name: 'October' }, { num: 11, name: 'November' },
  { num: 12, name: 'December' }, { num: 1, name: 'January' }, { num: 2, name: 'February' },
  { num: 3, name: 'March' },
];

function getAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

interface FeeRecord {
  id: string;
  month: number;
  year: number;
  is_paid: boolean;
  paid_at: string | null;
  amount: number;
}

interface StudentInfo {
  id: string;
  name: string;
  roll_no: string;
  bus: { bus_number: string; monthly_fee: number } | null;
}

export default function TeacherFees() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(getAcademicYear());

  const academicLabel = `${selectedYear}-${selectedYear + 1}`;

  const fetchData = async () => {
    try {
      const res = await api.get(`/teacher/students/${id}/fees?year=${selectedYear}`);
      setStudent(res.data.student);
      setFees(res.data.fees || []);
    } catch {
      toast.error('Failed to load fee records');
      navigate('/teacher/students');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id, selectedYear]);

  const togglePayment = async (fee: FeeRecord) => {
    setUpdating(fee.id);
    try {
      await api.patch(`/teacher/fees/${fee.id}`, { is_paid: !fee.is_paid });
      toast.success(fee.is_paid ? 'Marked as unpaid' : 'Marked as paid');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setUpdating(null); }
  };

  const paidCount = fees.filter(f => f.is_paid).length;
  const totalFees = fees.length;
  const paidAmount = fees.filter(f => f.is_paid).reduce((s, f) => s + f.amount, 0);
  const pendingAmount = fees.filter(f => !f.is_paid).reduce((s, f) => s + f.amount, 0);

  if (loading) return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <button
        onClick={() => navigate('/teacher/students')}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </button>

      {student && (
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 font-bold text-lg">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{student.name}</h1>
                <p className="text-gray-400 text-sm">Roll No: {student.roll_no}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {student.bus ? (
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-gold-400 font-medium">
                    <Bus className="w-4 h-4" />
                    {student.bus.bus_number}
                  </div>
                  <p className="text-xs text-gray-500">₹{student.bus.monthly_fee.toLocaleString('en-IN')}/month</p>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Day Scholar</span>
              )}
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
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{paidCount}/{totalFees}</p>
              <p className="text-xs text-gray-500">Months Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-400">₹{paidAmount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Collected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">₹{pendingAmount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee records */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold-400" />
          <h2 className="text-base font-semibold text-white">Fee Records — {academicLabel}</h2>
        </div>

        {fees.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No fee records for this academic year.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {ACADEMIC_MONTHS.map(({ num, name }) => {
              const feeYear = num >= 6 ? selectedYear : selectedYear + 1;
              const fee = fees.find(f => f.month === num && f.year === feeYear);
              if (!fee) return null;

              const isUpdating = updating === fee.id;

              return (
                <div key={num} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fee.is_paid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {fee.is_paid
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <XCircle className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{name} {feeYear}</p>
                      {fee.is_paid && fee.paid_at && (
                        <p className="text-xs text-gray-500">
                          Paid on {new Date(fee.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${fee.is_paid ? 'text-emerald-400' : 'text-white'}`}>
                      ₹{fee.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      id={`toggle-fee-${fee.id}`}
                      onClick={() => togglePayment(fee)}
                      disabled={isUpdating}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 min-w-[80px] text-center
                        ${fee.is_paid
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating
                        ? <span className="flex items-center justify-center gap-1"><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /></span>
                        : fee.is_paid ? 'Mark Unpaid' : 'Mark Paid'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
