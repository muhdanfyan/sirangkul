import React, { useState, useEffect } from 'react';
import { 
  Download, Calendar, Filter, FileText, 
  PieChart, BarChart3, TrendingUp, Loader2,
  ChevronDown, Search, ArrowUpRight, ArrowDownRight,
  Database, Activity, Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';

const Reporting: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('all');
  const [category, setCategory] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real data state
  const [summary, setSummary] = useState({
    totalProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    pendingProposals: 0,
    totalBudget: 0,
    usedBudget: 0,
    remainingBudget: 0
  });

  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchReportingData();
  }, []);

  const fetchReportingData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, trendsRes, breakdownRes] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getMonthlyTrends(),
        apiService.getCategoryBreakdown()
      ]);

      setSummary(summaryRes);
      setMonthlyTrends(trendsRes);
      setCategoryBreakdown(breakdownRes);
    } catch (error) {
      console.error('Error fetching reporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const exportReport = async (format: string = 'pdf') => {
    try {
      setIsExporting(true);
      const blob = await apiService.downloadReportExport(format === 'excel' ? 'csv' : 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_sirangkul_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Liquid Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics & Report Center</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Visualization of budget performance and proposal trends for Fiscal Year 2026.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportReport('pdf')}
            disabled={isExporting}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#EE4B2B] text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-100 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={18} />}
            Eksport PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            disabled={isExporting}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#1D6F42] text-white rounded-xl hover:bg-green-800 transition-all font-bold shadow-lg shadow-green-100 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText size={18} />}
            Eksport Excel
          </button>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Filter size={18} /></div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Parameter Laporan</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Rentang Awal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <input type="date" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Rentang Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <input type="date" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Jenis Laporan</label>
            <select className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all appearance-none cursor-pointer">
              <option>Ringkasan Eksekutif</option>
              <option>Detail Proposal</option>
              <option>Realisasi RKAM</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-50 flex items-center justify-center gap-2">
              <Activity size={16} />
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Matrix with Liquid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Proposal Count */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Database size={24} /></div>
              <div className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} /> 12%
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Total Submission</h4>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">{summary.totalProposals}</p>
              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: summary.totalProposals > 0 ? `${(summary.approvedProposals / summary.totalProposals) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><PieChart size={24} /></div>
              <div className="text-gray-400 font-bold text-[10px] uppercase">Verified</div>
            </div>
            <div className="mt-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Rate Persetujuan</h4>
              <p className="text-4xl font-black text-green-600 tracking-tighter">
                {summary.totalProposals > 0 ? ((summary.approvedProposals / summary.totalProposals) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Target: 75% per Semester</p>
            </div>
          </div>
        </div>

        {/* Total Budget - Liquid Handling for Long Text */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
            <div className="text-purple-600 font-bold text-[10px] uppercase bg-purple-50 px-2 py-1 rounded-lg">Total Pagu</div>
          </div>
          <div className="flex-grow flex flex-col justify-end">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Pagu Anggaran</h4>
            <div className="flex flex-wrap items-baseline gap-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight break-all leading-none">
                {formatCurrency(summary.totalBudget)}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-gray-400 font-medium truncate">Total Pagu Terdaftar</div>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
            <div className="text-orange-600 font-bold text-[10px] uppercase bg-orange-50 px-2 py-1 rounded-lg">Sisa Dana</div>
          </div>
          <div className="flex-grow flex flex-col justify-end">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Estimasi Sisa</h4>
            <div className="flex flex-wrap items-baseline gap-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight break-all leading-none">
                {formatCurrency(summary.remainingBudget)}
              </p>
            </div>
            <div className="mt-3 text-[10px] text-gray-400 font-medium truncate">Update Per Hari Ini</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress List: Monthly Trends */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Performa Bulanan</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {monthlyTrends.length > 0 ? monthlyTrends.map((d, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{d.month}</span>
                  <span className="text-xs font-black text-gray-900">{formatCurrency(parseFloat(d.budget))}</span>
                </div>
                <div className="h-4 w-full bg-gray-50 rounded-lg p-1 relative overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-md transition-all duration-1000" style={{ width: summary.totalBudget > 0 ? `${(parseFloat(d.budget) / summary.totalBudget) * 100}%` : '5%' }}></div>
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400 italic">{d.proposals} Propos</span>
                </div>
              </div>
            )) : (
              <p className="text-center py-4 text-gray-400 text-sm font-medium italic">Belum ada data tren bulanan.</p>
            )}
          </div>
        </div>

        {/* Progress List: Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Alokasi Kategori</h3>
            <BarChart3 className="text-gray-300" />
          </div>
          <div className="space-y-6">
            {categoryBreakdown.length > 0 ? categoryBreakdown.map((c, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.name}</div>
                <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.percentage}%` }}></div>
                </div>
                <div className="w-20 text-right">
                   <p className="text-xs font-black text-gray-900">{c.percentage}%</p>
                   <p className="text-[9px] text-gray-400 uppercase font-bold">{c.count} Unit</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-4 text-gray-400 text-sm font-medium italic">Belum ada data alokasi kategori.</p>
            )}
          </div>
          <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-50 flex items-center gap-3">
             <TrendingUp className="text-blue-600" size={20} />
             <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase tracking-tight">Kategori <span className="underline">Infrastruktur</span> mendominasi alokasi anggaran semester ini.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reporting;