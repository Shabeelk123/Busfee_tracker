import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, CheckCircle, XCircle } from 'lucide-react';

// Academic year months: June to March
const ACADEMIC_MONTHS = [
  { num: 6, name: 'Jun' }, { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' },
  { num: 9, name: 'Sep' }, { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' },
  { num: 12, name: 'Dec' }, { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' },
  { num: 3, name: 'Mar' },
];

function getAcademicYear() {
  const now = new Date();
  return now.getMonth() + 1 >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

// Generate a list of recent academic years
function getAcademicYears() {
  const current = getAcademicYear();
  return [current - 1, current, current + 1];
}

export default function AdminReports() {
  const [fees, setFees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState(getAcademicYear());
  const [loading, setLoading] = useState(true);

  const academicLabel = `${academicYear}-${academicYear + 1}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch for both halves of academic year
        const [feeResFirst, feeResSecond, sumRes] = await Promise.all([
          api.get(`/admin/fees?year=${academicYear}`),
          api.get(`/admin/fees?year=${academicYear + 1}`),
          api.get(`/admin/fees/summary?year=${academicYear}`),
        ]);
        // Combine both year halves
        const allFees = [
          ...(feeResFirst.data.fees || []),
          ...(feeResSecond.data.fees || []),
        ];
        setFees(allFees);
        setSummary(sumRes.data.summary);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [academicYear]);

  // Build chart data for academic months
  const chartData = ACADEMIC_MONTHS.map(({ num, name }) => {
    const feeYear = num >= 6 ? academicYear : academicYear + 1;
    const monthFees = fees.filter(f => f.month === num && f.year === feeYear);
    const paid = monthFees.filter(f => f.is_paid).length;
    const unpaid = monthFees.filter(f => !f.is_paid).length;
    return { month: name, paid, unpaid };
  });

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fee Reports</h1>
          <p className="text-gray-400 mt-1">Academic year fee collection analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Academic Year:</label>
          <select
            className="input-field w-36"
            value={academicYear}
            onChange={e => setAcademicYear(parseInt(e.target.value))}
          >
            {getAcademicYears().map(y => (
              <option key={y} value={y}>{y}-{y + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary && (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Collection Rate', value: `${summary.collection_rate}%`, color: 'text-gold-400' },
              { label: 'Total Paid', value: summary.paid, color: 'text-emerald-400' },
              { label: 'Pending', value: summary.unpaid, color: 'text-red-400' },
              { label: 'Revenue', value: `₹${(summary.paid_amount || 0).toLocaleString('en-IN')}`, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="glass-card p-5 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Monthly Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-white">Monthly Collection ({academicLabel})</h2>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Paid</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" />Unpaid</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={18} barGap={4}>
                <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" name="Unpaid" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fee Records Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">All Fee Records</h2>
              <span className="text-sm text-gray-500">{fees.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Student', 'Class', 'Bus', 'Month / Year', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fees.slice(0, 100).map(f => (
                    <tr key={f.id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="px-6 py-3 text-sm text-white font-medium">{f.student?.name}</td>
                      <td className="px-6 py-3 text-xs text-gray-400">{f.student?.class?.name} {f.student?.class?.section}</td>
                      <td className="px-6 py-3 text-xs text-gold-400">{f.student?.bus?.bus_number || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-300">
                        {ACADEMIC_MONTHS.find(m => m.num === f.month)?.name || `Month ${f.month}`} {f.year}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-white">₹{f.amount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3">
                        <span className={f.is_paid ? 'badge-paid' : 'badge-unpaid'}>
                          {f.is_paid ? (
                            <><CheckCircle className="w-3 h-3 inline mr-1" />Paid</>
                          ) : (
                            <><XCircle className="w-3 h-3 inline mr-1" />Unpaid</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {fees.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No records found for this academic year</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
