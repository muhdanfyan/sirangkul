import React, { useState } from 'react';
import { Search, Filter, Eye, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  submitter: string;
  amount: string;
  status: string;
  currentStage: string;
  submittedDate: string;
  lastUpdate: string;
  progress: number;
}

const ProposalTracking: React.FC = () => {
  const [proposals] = useState<Proposal[]>([
    {
      id: 'PR001',
      title: 'Renovasi Ruang Kelas 7A',
      submitter: 'Ahmad Fauzi',
      amount: 'Rp 15.000.000',
      status: 'Menunggu Verifikasi',
      currentStage: 'Verifikator',
      submittedDate: '2025-01-15',
      lastUpdate: '2025-01-15',
      progress: 25
    },
    {
      id: 'PR002',
      title: 'Pembelian Komputer Lab',
      submitter: 'Siti Nurhaliza',
      amount: 'Rp 25.000.000',
      status: 'Disetujui',
      currentStage: 'Selesai',
      submittedDate: '2025-01-10',
      lastUpdate: '2025-01-14',
      progress: 100
    },
    {
      id: 'PR003',
      title: 'Perbaikan Atap Mushalla',
      submitter: 'Muhammad Ali',
      amount: 'Rp 8.500.000',
      status: 'Dalam Review',
      currentStage: 'Kepala Madrasah',
      submittedDate: '2025-01-12',
      lastUpdate: '2025-01-13',
      progress: 50
    },
    {
      id: 'PR004',
      title: 'Pengadaan Buku Perpustakaan',
      submitter: 'Fatimah S.Pd',
      amount: 'Rp 5.000.000',
      status: 'Ditolak',
      currentStage: 'Verifikator',
      submittedDate: '2025-01-08',
      lastUpdate: '2025-01-09',
      progress: 25
    },
    {
      id: 'PR005',
      title: 'Pelatihan Guru Digital',
      submitter: 'Ahmad Fauzi',
      amount: 'Rp 12.000.000',
      status: 'Siap Bayar',
      currentStage: 'Bendahara',
      submittedDate: '2025-01-05',
      lastUpdate: '2025-01-12',
      progress: 75
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Ditolak':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Menunggu Verifikasi':
      case 'Dalam Review':
      case 'Siap Bayar':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-green-100 text-green-800';
      case 'Ditolak':
        return 'bg-red-100 text-red-800';
      case 'Menunggu Verifikasi':
        return 'bg-yellow-100 text-yellow-800';
      case 'Dalam Review':
        return 'bg-blue-100 text-blue-800';
      case 'Siap Bayar':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stages = [
    { name: 'Submitted', label: 'Diajukan' },
    { name: 'Verifikator', label: 'Verifikasi' },
    { name: 'Kepala Madrasah', label: 'Kepala Madrasah' },
    { name: 'Komite Madrasah', label: 'Komite' },
    { name: 'Bendahara', label: 'Bendahara' },
    { name: 'Selesai', label: 'Selesai' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lacak Proposal</h1>
        <p className="text-gray-600 mt-1">Monitor status dan progres proposal Anda</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari proposal atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Dalam Review">Dalam Review</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Siap Bayar">Siap Bayar</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Proposal</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Pengusul</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Anggaran</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Progress</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{proposal.title}</div>
                      <div className="text-sm text-gray-600">ID: {proposal.id}</div>
                      <div className="text-xs text-gray-500">
                        Diajukan: {proposal.submittedDate} • Update: {proposal.lastUpdate}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{proposal.submitter}</td>
                  <td className="py-4 px-6 text-right font-medium">{proposal.amount}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center mb-1">
                      {getStatusIcon(proposal.status)}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{proposal.currentStage}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(proposal.progress)}`}
                          style={{ width: `${proposal.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">{proposal.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => setSelectedProposal(proposal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detail Proposal</h2>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedProposal.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-medium">{selectedProposal.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pengusul:</span>
                    <span className="ml-2 font-medium">{selectedProposal.submitter}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Anggaran:</span>
                    <span className="ml-2 font-medium">{selectedProposal.amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedProposal.status)}`}>
                      {selectedProposal.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Timeline Persetujuan</h4>
                <div className="space-y-3">
                  {stages.map((stage, index) => {
                    const isCompleted = selectedProposal.progress >= ((index + 1) / stages.length) * 100;
                    const isCurrent = selectedProposal.currentStage === stage.name;
                    
                    return (
                      <div key={stage.name} className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          isCompleted 
                            ? 'bg-green-500 border-green-500' 
                            : isCurrent 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'bg-white border-gray-300'
                        }`}>
                          {isCompleted && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className={`text-sm ${
                          isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {stage.label}
                        </div>
                        {isCurrent && (
                          <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Sedang Diproses
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Download Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalTracking;