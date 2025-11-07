import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, DollarSign, Clock, AlertCircle, Download, ExternalLink, Search, Filter, Info } from 'lucide-react';
import { apiService, Proposal, ProposalStats, Payment } from '../services/api';
import Toast, { ToastType } from '../components/Toast';

const MyProposals: React.FC = () => {
  
  // State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from backend
      try {
        const [proposalsData, statsData] = await Promise.all([
          apiService.getMyProposals(),
          apiService.getProposalStatistics()
        ]);
        
        setProposals(proposalsData);
        setStats(statsData);
        
        console.log('✅ My proposals loaded:', { 
          proposals: proposalsData,
          stats: statsData 
        });
      } catch (apiError) {
        // Backend belum ready, gunakan data dummy untuk testing
        console.warn('⚠️ Backend endpoint not ready, using dummy data:', apiError);
        
        // Dummy proposals data
        const dummyProposals: Proposal[] = [
          {
            id: '1',
            rkam_id: 'rkam-1',
            user_id: 'user-1',
            title: 'Pengadaan Laptop untuk Lab Komputer',
            description: 'Pengadaan 10 unit laptop untuk mendukung pembelajaran di lab komputer',
            jumlah_pengajuan: 50000000,
            status: 'completed',
            submitted_at: '2024-10-01T08:00:00Z',
            verified_at: '2024-10-02T10:00:00Z',
            approved_at: '2024-10-03T14:00:00Z',
            final_approved_at: '2024-10-04T09:00:00Z',
            completed_at: '2024-10-10T15:30:00Z',
            created_at: '2024-09-28T10:00:00Z',
            updated_at: '2024-10-10T15:30:00Z',
            rkam: {
              id: 'rkam-1',
              kategori: 'Sarana Prasarana',
              item_name: 'Peralatan Komputer',
              pagu: 100000000,
              tahun_anggaran: 2024,
              deskripsi: 'Anggaran untuk peralatan komputer',
              terpakai: 50000000,
              sisa: 50000000,
              persentase: 50,
              status: 'Normal'
            },
            verifier: { id: 'v1', full_name: 'Budi Verifikator' },
            approver: { id: 'a1', full_name: 'Siti Kepala Madrasah' },
            final_approver: { id: 'f1', full_name: 'Ahmad Komite' },
            payment: {
              id: 'pay-1',
              proposal_id: '1',
              amount: 50000000,
              recipient_name: 'Lab Komputer',
              recipient_account: '1234567890',
              bank_name: 'BNI',
              payment_method: 'transfer',
              payment_proof_url: 'https://example.com/proof1.jpg',
              payment_proof_file: 'payment_proofs/proof1.pdf',
              status: 'completed',
              completed_at: '2024-10-10T15:30:00Z',
              admin_notes: 'Pembayaran telah selesai dilakukan',
              created_at: '2024-10-05T10:00:00Z',
              updated_at: '2024-10-10T15:30:00Z'
            }
          },
          {
            id: '2',
            rkam_id: 'rkam-2',
            user_id: 'user-1',
            title: 'Renovasi Ruang Kelas',
            description: 'Renovasi 5 ruang kelas untuk meningkatkan kenyamanan belajar',
            jumlah_pengajuan: 75000000,
            status: 'rejected',
            submitted_at: '2024-09-15T08:00:00Z',
            verified_at: '2024-09-16T10:00:00Z',
            rejected_at: '2024-09-17T14:00:00Z',
            rejected_by: 'r1',
            rejection_reason: 'Anggaran tidak mencukupi untuk tahun ini. Silakan ajukan kembali tahun depan dengan rincian yang lebih detail.',
            created_at: '2024-09-14T10:00:00Z',
            updated_at: '2024-09-17T14:00:00Z',
            rkam: {
              id: 'rkam-2',
              kategori: 'Sarana Prasarana',
              item_name: 'Renovasi Bangunan',
              pagu: 50000000,
              tahun_anggaran: 2024,
              deskripsi: 'Anggaran renovasi',
              terpakai: 20000000,
              sisa: 30000000,
              persentase: 40,
              status: 'Normal'
            },
            verifier: { id: 'v1', full_name: 'Budi Verifikator' },
            rejected_by_user: { id: 'r1', full_name: 'Siti Kepala Madrasah', role: 'Kepala Madrasah' }
          },
          {
            id: '3',
            rkam_id: 'rkam-3',
            user_id: 'user-1',
            title: 'Pengadaan Buku Perpustakaan',
            description: 'Pengadaan 500 buku bacaan untuk perpustakaan',
            jumlah_pengajuan: 25000000,
            status: 'payment_processing',
            submitted_at: '2024-10-20T08:00:00Z',
            verified_at: '2024-10-21T10:00:00Z',
            approved_at: '2024-10-22T14:00:00Z',
            final_approved_at: '2024-10-23T09:00:00Z',
            created_at: '2024-10-19T10:00:00Z',
            updated_at: '2024-10-23T09:00:00Z',
            rkam: {
              id: 'rkam-3',
              kategori: 'Pembelajaran',
              item_name: 'Buku dan Media Pembelajaran',
              pagu: 50000000,
              tahun_anggaran: 2024,
              deskripsi: 'Anggaran buku pembelajaran',
              terpakai: 10000000,
              sisa: 40000000,
              persentase: 20,
              status: 'Normal'
            },
            verifier: { id: 'v1', full_name: 'Budi Verifikator' },
            approver: { id: 'a1', full_name: 'Siti Kepala Madrasah' },
            final_approver: { id: 'f1', full_name: 'Ahmad Komite' }
          },
          {
            id: '4',
            rkam_id: 'rkam-4',
            user_id: 'user-1',
            title: 'Pelatihan Guru Digital',
            description: 'Pelatihan untuk 20 guru tentang penggunaan teknologi digital',
            jumlah_pengajuan: 15000000,
            status: 'verified',
            submitted_at: '2024-11-01T08:00:00Z',
            verified_at: '2024-11-02T10:00:00Z',
            created_at: '2024-10-30T10:00:00Z',
            updated_at: '2024-11-02T10:00:00Z',
            rkam: {
              id: 'rkam-4',
              kategori: 'Pengembangan SDM',
              item_name: 'Pelatihan Guru',
              pagu: 30000000,
              tahun_anggaran: 2024,
              deskripsi: 'Anggaran pelatihan',
              terpakai: 5000000,
              sisa: 25000000,
              persentase: 16.67,
              status: 'Normal'
            },
            verifier: { id: 'v1', full_name: 'Budi Verifikator' }
          },
          {
            id: '5',
            rkam_id: 'rkam-5',
            user_id: 'user-1',
            title: 'Pengadaan AC untuk Ruang Guru',
            description: 'Pengadaan 3 unit AC untuk ruang guru',
            jumlah_pengajuan: 18000000,
            status: 'draft',
            created_at: '2024-11-05T10:00:00Z',
            updated_at: '2024-11-05T10:00:00Z',
            rkam: {
              id: 'rkam-5',
              kategori: 'Sarana Prasarana',
              item_name: 'Peralatan Kantor',
              pagu: 40000000,
              tahun_anggaran: 2024,
              deskripsi: 'Anggaran peralatan kantor',
              terpakai: 15000000,
              sisa: 25000000,
              persentase: 37.5,
              status: 'Normal'
            }
          }
        ];

        // Dummy stats
        const dummyStats: ProposalStats = {
          total: 5,
          draft: 1,
          submitted: 0,
          verified: 1,
          approved: 0,
          rejected: 1,
          final_approved: 0,
          payment_processing: 1,
          completed: 1,
          total_amount_completed: 50000000
        };

        setProposals(dummyProposals);
        setStats(dummyStats);
        
        setToast({
          message: '⚠️ Menggunakan data dummy. Backend belum ready untuk /my-proposals dan /statistics',
          type: 'warning'
        });
        
        console.log('📊 Dummy data loaded:', { 
          proposals: dummyProposals,
          stats: dummyStats 
        });
      }
    } catch (err: unknown) {
      console.error('❌ Error fetching proposals:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data proposal');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'submitted': { color: 'bg-blue-100 text-blue-800', label: 'Diajukan' },
      'verified': { color: 'bg-indigo-100 text-indigo-800', label: 'Terverifikasi' },
      'approved': { color: 'bg-purple-100 text-purple-800', label: 'Disetujui' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
      'final_approved': { color: 'bg-green-100 text-green-800', label: 'Final Approved' },
      'payment_processing': { color: 'bg-yellow-100 text-yellow-800', label: 'Proses Pembayaran' },
      'completed': { color: 'bg-emerald-100 text-emerald-800', label: 'Selesai' }
    };

    const badge = badges[status as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const showProposalDetail = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const showRejectionReason = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowRejectionModal(true);
  };

  const handleDownloadProof = async (payment: Payment) => {
    try {
      if (payment.payment_proof_file) {
        const blob = await apiService.downloadPaymentProof(payment.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = payment.payment_proof_file.split('/').pop() || 'bukti_pembayaran';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setToast({
          message: 'Bukti pembayaran berhasil didownload!',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error downloading payment proof:', error);
      setToast({
        message: 'Gagal mendownload bukti pembayaran',
        type: 'error'
      });
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    
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
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proposal Saya</h1>
        <p className="text-gray-600 mt-1">Pantau status dan riwayat proposal Anda</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Proposal</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Selesai</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-sm text-gray-600">Ditolak</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatRupiah(stats.total_amount_completed)}</p>
                <p className="text-sm text-gray-600">Total Dibayar</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari proposal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Diajukan</option>
              <option value="verified">Terverifikasi</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="final_approved">Final Approved</option>
              <option value="payment_processing">Proses Pembayaran</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RKAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada proposal ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{proposal.title}</p>
                        {proposal.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{proposal.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {proposal.rkam?.kategori || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatRupiah(proposal.jumlah_pengajuan)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(proposal.status)}
                        {proposal.status === 'rejected' && proposal.rejection_reason && (
                          <button
                            onClick={() => showRejectionReason(proposal)}
                            className="text-red-600 hover:text-red-800"
                            title="Lihat alasan penolakan"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(proposal.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => showProposalDetail(proposal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Info className="h-5 w-5" />
                        </button>
                        {proposal.status === 'rejected' && proposal.rejection_reason && (
                          <button
                            onClick={() => showRejectionReason(proposal)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Alasan Penolakan"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Detail Proposal</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informasi Proposal</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Judul:</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedProposal.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">RKAM:</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedProposal.rkam?.kategori} - {selectedProposal.rkam?.item_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jumlah:</p>
                    <p className="font-medium text-green-600 text-lg mt-1">
                      {formatRupiah(selectedProposal.jumlah_pengajuan)}
                    </p>
                  </div>
                  {selectedProposal.description && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Deskripsi:</p>
                      <p className="text-gray-900 mt-1">{selectedProposal.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3">
                  {selectedProposal.submitted_at && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Diajukan</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.verified_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Diverifikasi</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.verified_at)}</p>
                        {selectedProposal.verifier && (
                          <p className="text-xs text-gray-500">oleh {selectedProposal.verifier.full_name}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedProposal.approved_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Disetujui</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.approved_at)}</p>
                        {selectedProposal.approver && (
                          <p className="text-xs text-gray-500">oleh {selectedProposal.approver.full_name}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedProposal.final_approved_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Final Approved</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.final_approved_at)}</p>
                        {selectedProposal.final_approver && (
                          <p className="text-xs text-gray-500">oleh {selectedProposal.final_approver.full_name}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedProposal.completed_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Selesai</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedProposal.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Info */}
              {selectedProposal.status === 'rejected' && selectedProposal.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Alasan Penolakan
                  </h4>
                  <p className="text-red-800 text-sm">{selectedProposal.rejection_reason}</p>
                  <div className="mt-3 text-xs text-red-700 space-y-1">
                    {selectedProposal.rejected_by_user && (
                      <p>Ditolak oleh: <strong>{selectedProposal.rejected_by_user.full_name}</strong></p>
                    )}
                    {selectedProposal.rejected_at && (
                      <p>Tanggal: {formatDate(selectedProposal.rejected_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              {selectedProposal.status === 'completed' && selectedProposal.payment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Informasi Pembayaran
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Jumlah:</span>
                      <span className="font-medium text-green-900">
                        {formatRupiah(selectedProposal.payment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Penerima:</span>
                      <span className="font-medium text-green-900">
                        {selectedProposal.payment.recipient_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Metode:</span>
                      <span className="font-medium text-green-900 capitalize">
                        {selectedProposal.payment.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Tanggal:</span>
                      <span className="font-medium text-green-900">
                        {formatDate(selectedProposal.payment.completed_at)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Proof Links */}
                  <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
                    {selectedProposal.payment.payment_proof_file && (
                      <button
                        onClick={() => handleDownloadProof(selectedProposal.payment!)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download Bukti Pembayaran
                      </button>
                    )}
                    
                    {selectedProposal.payment.payment_proof_url && (
                      <a
                        href={selectedProposal.payment.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Lihat Bukti Pembayaran
                      </a>
                    )}
                  </div>

                  {selectedProposal.payment.admin_notes && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-green-700 mb-1">Catatan Bendahara:</p>
                      <p className="text-sm text-green-900">{selectedProposal.payment.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <XCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Proposal Ditolak
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProposal.title}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">Alasan Penolakan:</h4>
                <p className="text-red-800">{selectedProposal.rejection_reason}</p>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-6">
                {selectedProposal.rejected_by_user && (
                  <p>Ditolak oleh: <strong className="text-gray-900">{selectedProposal.rejected_by_user.full_name}</strong></p>
                )}
                {selectedProposal.rejected_at && (
                  <p>Tanggal: <strong className="text-gray-900">{formatDate(selectedProposal.rejected_at)}</strong></p>
                )}
              </div>

              <button 
                onClick={() => setShowRejectionModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MyProposals;
