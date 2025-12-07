import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
  PieChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Proposal',
      value: '47',
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Menunggu Approval',
      value: '8',
      change: '+3',
      changeType: 'neutral',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Disetujui',
      value: '32',
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Budget Tersisa',
      value: 'Rp 2.4M',
      change: '-15%',
      changeType: 'negative',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  const recentProposals = [
    {
      id: 'PR001',
      title: 'Renovasi Ruang Kelas 7A',
      submitter: 'Ahmad Fauzi',
      amount: 'Rp 15.000.000',
      status: 'Menunggu Verifikasi',
      date: '2025-01-15'
    },
    {
      id: 'PR002',
      title: 'Pembelian Komputer Lab',
      submitter: 'Siti Nurhaliza',
      amount: 'Rp 25.000.000',
      status: 'Disetujui',
      date: '2025-01-14'
    },
    {
      id: 'PR003',
      title: 'Perbaikan Atap Mushalla',
      submitter: 'Muhammad Ali',
      amount: 'Rp 8.500.000',
      status: 'Dalam Review',
      date: '2025-01-13'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-green-100 text-green-800';
      case 'Menunggu Verifikasi':
        return 'bg-yellow-100 text-yellow-800';
      case 'Dalam Review':
        return 'bg-blue-100 text-blue-800';
      case 'Ditolak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPengusul = (user?.role || '').toLowerCase() === 'pengusul';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Selamat Datang, {user?.name}</h1>
        <p className="text-blue-100">Dashboard SiRangkul - {user?.role}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-gray-500 text-sm ml-1">dari bulan lalu</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Proposal Terbaru</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {proposal.submitter} • {proposal.amount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{proposal.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ringkasan Anggaran</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Pagu</span>
                <span className="font-semibold">Rp 10.000.000.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Terpakai</span>
                <span className="font-semibold text-blue-600">Rp 7.600.000.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tersisa</span>
                <span className="font-semibold text-green-600">Rp 2.400.000.000</span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress Penggunaan</span>
                  <span>76%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">15</div>
                  <div className="text-xs text-gray-600">Proposal Aktif</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">32</div>
                  <div className="text-xs text-gray-600">Selesai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isPengusul && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/proposal-submission" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Buat Proposal Baru</div>
                <div className="text-sm text-gray-600">Submit proposal baru</div>
              </div>
            </Link>
            <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Cek Status</div>
                <div className="text-sm text-gray-600">Lacak proposal Anda</div>
              </div>
            </button>
            <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <PieChart className="h-8 w-8 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Lihat Laporan</div>
                <div className="text-sm text-gray-600">Download laporan</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;