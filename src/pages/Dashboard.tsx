import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle,
  DollarSign,
  PieChart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { apiService, DashboardSummary, Proposal } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumData, propData] = await Promise.all([
          apiService.getDashboardSummary(),
          apiService.getAllProposals()
        ]);
        setSummary(sumData);
        // Take only 5 most recent
        setProposals(propData.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Gagal mengambil data dashboard. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'final_approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
      case 'verified':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_processing':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPengusul = (user?.role || '').toLowerCase() === 'pengusul';

  const banners = [
    'https://man2kotamakassar.sch.id/images/banner2.jpg',
    'https://man2kotamakassar.sch.id/images/banner3.jpg',
    'https://man2kotamakassar.sch.id/images/banner/banner1_697342326d5ff.jpg',
  ];

  const [currentBanner, setCurrentBanner] = React.useState(0);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mb-4" />
        <p className="text-gray-600">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 mb-2">Terjadi Kesalahan</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Proposal',
      value: summary?.totalProposals || 0,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Menunggu Approval',
      value: summary?.pendingProposals || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Disetujui',
      value: summary?.approvedProposals || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'RKAM Tersisa',
      value: formatCurrency(summary?.remainingBudget || 0),
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative rounded-xl overflow-hidden h-48 md:h-56 shadow-lg border border-gray-100">
          {banners.map((banner, index) => (
            <img
              key={index}
              src={banner}
              alt={`Banner ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="text-white drop-shadow-md">
              <h2 className="text-2xl font-bold">MAN 2 Kota Makassar</h2>
              <p className="text-white/80 text-sm">Sistem Informasi Rencana Anggaran & Kelola Usulan</p>
            </div>
            <div className="flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentBanner ? 'bg-white w-6 shadow-sm' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl p-8 text-white shadow-xl shadow-cyan-100 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Selamat Datang, {user?.full_name}</h1>
          <p className="text-cyan-100 opacity-90">Anda masuk sebagai <span className="font-semibold uppercase tracking-wider">{user?.role}</span></p>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10">
          <PieChart className="h-32 w-32" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Proposal Terbaru</h3>
            <Link to="/proposals" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">Lihat Semua</Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <Link key={proposal.id} to={`/proposals/${proposal.id}`} className="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/10 rounded-xl transition-all group">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-1">{proposal.title}</h4>
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${getStatusColor(proposal.status)}`}>
                          {proposal.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                        <span>{proposal.user?.full_name || 'User'}</span>
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                        <span className="font-medium text-teal-600">{formatCurrency(Number(proposal.jumlah_pengajuan))}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(proposal.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 italic">Belum ada proposal yang masuk.</div>
              )}
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Ringkasan Anggaran</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Total Pagu (RKAM)</span>
                <span className="font-bold text-gray-900">{formatCurrency(summary?.totalBudget || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                <span className="text-sm text-gray-600 font-medium">Realisasi (Terpakai)</span>
                <span className="font-bold text-blue-700">{formatCurrency(summary?.usedBudget || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50/30 rounded-xl border border-green-100">
                <span className="text-sm text-gray-600 font-medium">Sisa Anggaran</span>
                <span className="font-bold text-green-700">{formatCurrency(summary?.remainingBudget || 0)}</span>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                  <span>Persentase Penggunaan</span>
                  <span className="text-cyan-600">
                    {summary?.totalBudget ? Math.round((summary.usedBudget / summary.totalBudget) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 p-0.5 border border-gray-200">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all duration-1000 shadow-sm shadow-cyan-200" 
                    style={{ width: `${summary?.totalBudget ? Math.round((summary.usedBudget / summary.totalBudget) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="mt-4">
                  <Link 
                    to="/rkam-viewer" 
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 text-gray-700 rounded-xl border border-gray-100 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-all font-semibold text-sm group"
                  >
                    <PieChart className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    Lihat Detail RKAM
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100">
                  <div className="text-2xl font-black text-cyan-600">{summary?.pendingProposals || 0}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Pending Approval</div>
                </div>
                <div className="text-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="text-2xl font-black text-emerald-600">{summary?.approvedProposals || 0}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Selesai/Disetujui</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isPengusul && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-cyan-600" />
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/proposal-submission" className="flex items-center p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all group">
              <div className="bg-blue-600 p-3 rounded-xl mr-4 shadow-md group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Proposal Baru</div>
                <div className="text-xs text-gray-500">Buat pengajuan anggaran baru</div>
              </div>
            </Link>
            <Link to="/proposals" className="flex items-center p-5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 hover:border-green-400 hover:shadow-lg hover:shadow-green-50 transition-all group">
              <div className="bg-green-600 p-3 rounded-xl mr-4 shadow-md group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Cek Status</div>
                <div className="text-xs text-gray-500">Lacak pengajuan aktif Anda</div>
              </div>
            </Link>
            <Link to="/reporting" className="flex items-center p-5 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-50 transition-all group">
              <div className="bg-purple-600 p-3 rounded-xl mr-4 shadow-md group-hover:scale-110 transition-transform">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Laporan Saya</div>
                <div className="text-xs text-gray-500">Lihat histori dan realisasi</div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;