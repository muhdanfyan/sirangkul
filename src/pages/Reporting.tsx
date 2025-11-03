import React, { useState } from 'react';
import { Download, Filter, FileText, PieChart, BarChart3, TrendingUp } from 'lucide-react';

const Reporting: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('all');
  const [category, setCategory] = useState('all');

  const reportSummary = {
    totalProposals: 47,
    approvedProposals: 32,
    rejectedProposals: 8,
    pendingProposals: 7,
    totalBudget: 2400000000,
    usedBudget: 1800000000,
    remainingBudget: 600000000
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const monthlyData = [
    { month: 'Jan', proposals: 12, budget: 450000000 },
    { month: 'Feb', proposals: 8, budget: 320000000 },
    { month: 'Mar', proposals: 15, budget: 580000000 },
    { month: 'Apr', proposals: 10, budget: 380000000 },
    { month: 'May', proposals: 2, budget: 70000000 }
  ];

  const categoryData = [
    { name: 'Infrastruktur', count: 15, percentage: 32, budget: 750000000 },
    { name: 'Pendidikan', count: 12, percentage: 26, budget: 480000000 },
    { name: 'Teknologi', count: 8, percentage: 17, budget: 320000000 },
    { name: 'Pemeliharaan', count: 7, percentage: 15, budget: 280000000 },
    { name: 'Kesehatan', count: 3, percentage: 6, budget: 120000000 },
    { name: 'Lainnya', count: 2, percentage: 4, budget: 80000000 }
  ];

  const exportReport = (format: string) => {
    alert(`Mengekspor laporan dalam format ${format.toUpperCase()}`);
  };

  const generateReport = () => {
    alert('Laporan berhasil dibuat!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analisis</h1>
          <p className="text-gray-600 mt-1">Ringkasan dan analisis data proposal dan anggaran</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Proposal</option>
              <option value="approved">Disetujui</option>
              <option value="pending">Pending</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Kategori</option>
              <option value="infrastructure">Infrastruktur</option>
              <option value="education">Pendidikan</option>
              <option value="technology">Teknologi</option>
              <option value="maintenance">Pemeliharaan</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={generateReport}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Generate Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proposal</p>
              <p className="text-3xl font-bold text-gray-900">{reportSummary.totalProposals}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-500 ml-1">dari bulan lalu</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disetujui</p>
              <p className="text-3xl font-bold text-green-600">{reportSummary.approvedProposals}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {((reportSummary.approvedProposals / reportSummary.totalProposals) * 100).toFixed(1)}% tingkat persetujuan
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Anggaran</p>
              <p className="text-2xl font-bold text-blue-600">{formatRupiah(reportSummary.totalBudget)}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {((reportSummary.usedBudget / reportSummary.totalBudget) * 100).toFixed(1)}% terpakai
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sisa Anggaran</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(reportSummary.remainingBudget)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {((reportSummary.remainingBudget / reportSummary.totalBudget) * 100).toFixed(1)}% tersisa
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Bulanan</h3>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 text-sm font-medium text-gray-600">{month.month}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(month.proposals / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{month.proposals} proposal</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">{formatRupiah(month.budget)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Proposal</h3>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-24 text-sm font-medium text-gray-600">{category.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 font-medium w-12 text-right">
                    {category.percentage}%
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">{category.count} proposal</div>
                  <div className="text-xs text-gray-600">{formatRupiah(category.budget)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Laporan Detail</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">Laporan Proposal</span>
            </div>
            <p className="text-sm text-gray-600">Detail semua proposal dengan status dan progres</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <PieChart className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Laporan Anggaran</span>
            </div>
            <p className="text-sm text-gray-600">Analisis penggunaan dan sisa anggaran per kategori</p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-medium">Laporan Kinerja</span>
            </div>
            <p className="text-sm text-gray-600">Evaluasi kinerja sistem dan efisiensi proses</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reporting;