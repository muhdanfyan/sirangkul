import React, { useState, useEffect } from 'react';
import { Search, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiService, Proposal } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ProposalTracking: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllProposals();
      setProposals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat proposals';
      setError(errorMessage);
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Calculate progress percentage based on status
  const getProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      'draft': 0,
      'submitted': 20,
      'verified': 40,
      'approved': 60,
      'final_approved': 80,
      'payment_processing': 90,
      'completed': 100,
      'rejected': 0,
    };
    return progressMap[status] || 0;
  };

  // Helper: Get current stage name
  const getCurrentStageName = (status: string): string => {
    const stageMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Verifikator',
      'verified': 'Kepala Madrasah',
      'approved': 'Komite Madrasah',
      'final_approved': 'Bendahara',
      'payment_processing': 'Bendahara',
      'completed': 'Selesai',
      'rejected': 'Ditolak',
    };
    return stageMap[status] || 'Unknown';
  };

  // Helper: Format rupiah
  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Helper: Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'final_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'submitted':
      case 'verified':
      case 'approved':
      case 'payment_processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'verified': 'bg-cyan-100 text-cyan-800',
      'approved': 'bg-purple-100 text-purple-800',
      'rejected': 'bg-red-100 text-red-800',
      'final_approved': 'bg-green-100 text-green-800',
      'payment_processing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-emerald-100 text-emerald-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Menunggu Verifikasi',
      'verified': 'Terverifikasi',
      'approved': 'Disetujui Kepala',
      'rejected': 'Ditolak',
      'final_approved': 'Disetujui Akhir',
      'payment_processing': 'Proses Pembayaran',
      'completed': 'Selesai',
    };
    return labelMap[status] || status;
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const filteredProposals = proposals.filter(proposal => {
    const userName = proposal.user?.name || proposal.user?.full_name || '';
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchProposals}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

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
            <option value="draft">Draft</option>
            <option value="submitted">Menunggu Verifikasi</option>
            <option value="verified">Terverifikasi</option>
            <option value="approved">Disetujui Kepala</option>
            <option value="rejected">Ditolak</option>
            <option value="final_approved">Disetujui Akhir</option>
            <option value="payment_processing">Proses Pembayaran</option>
            <option value="completed">Selesai</option>
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
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search size={48} className="text-gray-300 mb-3" />
                      <p className="font-medium">Tidak ada proposal</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter ? 'Coba ubah filter pencarian' : 'Belum ada proposal yang dibuat'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => {
                  const progress = getProgress(proposal.status);
                  const currentStage = getCurrentStageName(proposal.status);
                  
                  return (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{proposal.title}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {proposal.description || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Diajukan: {formatDate(proposal.submitted_at)} • Update: {formatDate(proposal.updated_at)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {proposal.user?.name || proposal.user?.full_name || '-'}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {formatRupiah(proposal.jumlah_pengajuan)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center mb-1">
                          {getStatusIcon(proposal.status)}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                          {getStatusLabel(proposal.status)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{currentStage}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 w-8 text-right">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => setSelectedProposal(proposal)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/proposals/${proposal.id}/approval`)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Lihat Approval"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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
                {selectedProposal.description && (
                  <p className="text-sm text-gray-600 mb-3">{selectedProposal.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pengusul:</span>
                    <span className="ml-2 font-medium">{selectedProposal.user?.name || selectedProposal.user?.full_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedProposal.user?.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Anggaran:</span>
                    <span className="ml-2 font-medium">{formatRupiah(selectedProposal.jumlah_pengajuan)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedProposal.status)}`}>
                      {getStatusLabel(selectedProposal.status)}
                    </span>
                  </div>
                  {selectedProposal.rkam && (
                    <>
                      <div>
                        <span className="text-gray-600">RKAM:</span>
                        <span className="ml-2 font-medium">{selectedProposal.rkam.item_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kategori:</span>
                        <span className="ml-2 font-medium">{selectedProposal.rkam.kategori}</span>
                      </div>
                    </>
                  )}
                  {selectedProposal.requires_committee_approval && (
                    <div className="col-span-2">
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        ⚠️ Memerlukan persetujuan Komite Madrasah (budget &gt; Rp 50.000.000)
                      </div>
                    </div>
                  )}
                  {selectedProposal.rejection_reason && (
                    <div className="col-span-2">
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800 mb-1">Alasan Penolakan:</p>
                        <p className="text-xs text-red-700">{selectedProposal.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Timeline Persetujuan</h4>
                <div className="space-y-3">
                  {/* Draft */}
                  <div className="flex items-start">
                    <div className="w-3 h-3 rounded-full bg-gray-400 mt-0.5 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Draft</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedProposal.created_at)}</p>
                    </div>
                  </div>

                  {/* Submitted */}
                  {selectedProposal.submitted_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-blue-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Diajukan</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.submitted_at)}</p>
                      </div>
                    </div>
                  )}

                  {/* Verified */}
                  {selectedProposal.verified_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-cyan-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Diverifikasi</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(selectedProposal.verified_at)}
                          {selectedProposal.verifier && ` • ${selectedProposal.verifier.full_name}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Approved */}
                  {selectedProposal.approved_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-purple-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Disetujui Kepala Madrasah</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(selectedProposal.approved_at)}
                          {selectedProposal.approver && ` • ${selectedProposal.approver.full_name}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Final Approved */}
                  {selectedProposal.final_approved_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-green-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Disetujui Akhir</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(selectedProposal.final_approved_at)}
                          {selectedProposal.final_approver && ` • ${selectedProposal.final_approver.full_name}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {selectedProposal.completed_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-emerald-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Selesai</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.completed_at)}</p>
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {selectedProposal.rejected_at && (
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-red-600 mt-0.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Ditolak</p>
                        <p className="text-xs text-red-700">
                          {formatDate(selectedProposal.rejected_at)}
                          {selectedProposal.rejector && ` • ${selectedProposal.rejector.full_name}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Stage Indicator */}
                  {selectedProposal.status !== 'completed' && selectedProposal.status !== 'rejected' && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Saat ini di: <span className="font-medium">{getCurrentStageName(selectedProposal.status)}</span>
                      </p>
                    </div>
                  )}
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
                <button 
                  onClick={() => navigate(`/proposals/${selectedProposal.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lihat Detail Lengkap
                </button>
                {selectedProposal.status !== 'draft' && (
                  <button 
                    onClick={() => navigate(`/proposals/${selectedProposal.id}/approval`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Approval Workflow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalTracking;