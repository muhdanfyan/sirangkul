import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Search,
  XCircle,
} from 'lucide-react';
import { apiService, Payment, Proposal, ProposalStats } from '../services/api';
import Toast, { ToastType } from '../components/Toast';
import { getPaymentStatusLabel, isPaymentCompleted } from '../utils/paymentStatus';

const MyProposals: React.FC = () => {
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [proposalsData, statsData] = await Promise.all([
        apiService.getMyProposals(),
        apiService.getProposalStatistics(),
      ]);

      setProposals(proposalsData);
      setStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data proposal';
      setError(message);
      setToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Menunggu Verifikator' },
      verified: { color: 'bg-indigo-100 text-indigo-800', label: 'Menunggu Komite Madrasah' },
      approved: { color: 'bg-purple-100 text-purple-800', label: 'Menunggu Kepala Madrasah' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
      final_approved: { color: 'bg-green-100 text-green-800', label: 'Siap Dibayar' },
      payment_processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Proses Pembayaran' },
      completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Sudah Terbayar' },
    };

    const badge = badges[status as keyof typeof badges] || {
      color: 'bg-gray-100 text-gray-800',
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredProposals = proposals.filter((proposal) => {
    const keyword = searchTerm.toLowerCase();
    const matchesSearch = !keyword
      || proposal.title.toLowerCase().includes(keyword)
      || (proposal.description || '').toLowerCase().includes(keyword)
      || (proposal.rkam?.item_name || '').toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openProposalDetail = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const openRejectionModal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowRejectionModal(true);
  };

  const closeModals = () => {
    setSelectedProposal(null);
    setShowDetailModal(false);
    setShowRejectionModal(false);
  };

  const handleDownloadProof = async (payment: Payment) => {
    try {
      const blob = await apiService.downloadPaymentProof(payment.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = payment.payment_proof_file?.split('/').pop() || 'bukti_pembayaran';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      setToast({
        message: 'Bukti pembayaran berhasil diunduh.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Gagal mengunduh bukti pembayaran',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-red-900">Gagal memuat proposal</h1>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proposal Saya</h1>
        <p className="text-gray-600 mt-1">Pantau status, catatan persetujuan, dan riwayat pembayaran proposal Anda.</p>
      </div>

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
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.payment_processing}</p>
                <p className="text-sm text-gray-600">Proses Pembayaran</p>
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

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul proposal atau RKAM..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Menunggu Verifikator</option>
              <option value="verified">Menunggu Komite Madrasah</option>
              <option value="approved">Menunggu Kepala Madrasah</option>
              <option value="rejected">Ditolak</option>
              <option value="final_approved">Siap Dibayar</option>
              <option value="payment_processing">Proses Pembayaran</option>
              <option value="completed">Sudah Terbayar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RKAM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada proposal ditemukan.</p>
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
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatRupiah(proposal.jumlah_pengajuan)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(proposal.status)}
                          {proposal.status === 'rejected' && proposal.rejection_reason && (
                            <button
                              onClick={() => openRejectionModal(proposal)}
                              className="text-red-600 hover:text-red-800"
                              title="Lihat alasan penolakan"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {proposal.payment && (
                          <p className={`text-xs font-medium ${isPaymentCompleted(proposal.payment) ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {isPaymentCompleted(proposal.payment)
                              ? `Terbayar ${formatDate(proposal.payment.completed_at || proposal.completed_at)}`
                              : `Status pembayaran: ${getPaymentStatusLabel(proposal.payment.status)}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(proposal.updated_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openProposalDetail(proposal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat ringkasan"
                        >
                          <Info className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Buka detail lengkap"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </button>

                        {(proposal.status === 'draft' || proposal.status === 'rejected') && (
                          <button
                            onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={proposal.status === 'rejected' ? 'Edit dan ajukan ulang' : 'Edit proposal'}
                          >
                            <FileText className="h-5 w-5" />
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

      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Detail Proposal</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informasi Proposal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Judul</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedProposal.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-600">RKAM</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedProposal.rkam?.kategori || '-'}{selectedProposal.rkam?.item_name ? ` - ${selectedProposal.rkam.item_name}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jumlah Pengajuan</p>
                    <p className="font-medium text-green-600 text-lg mt-1">
                      {formatRupiah(selectedProposal.jumlah_pengajuan)}
                    </p>
                  </div>
                  {selectedProposal.description && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Deskripsi</p>
                      <p className="text-gray-900 mt-1">{selectedProposal.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Dibuat</p>
                      <p className="text-gray-600">{formatDate(selectedProposal.created_at)}</p>
                    </div>
                  </div>
                  {selectedProposal.submitted_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Diajukan</p>
                        <p className="text-gray-600">{formatDate(selectedProposal.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.verified_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Diverifikasi</p>
                        <p className="text-gray-600">{formatDate(selectedProposal.verified_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.approved_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Disetujui Komite Madrasah</p>
                        <p className="text-gray-600">{formatDate(selectedProposal.approved_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.final_approved_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Disetujui Kepala Madrasah</p>
                        <p className="text-gray-600">{formatDate(selectedProposal.final_approved_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.completed_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Sudah Terbayar</p>
                        <p className="text-gray-600">{formatDate(selectedProposal.completed_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedProposal.rejected_at && (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Ditolak</p>
                        <p className="text-red-700">{formatDate(selectedProposal.rejected_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(selectedProposal.rejection_reason || selectedProposal.improvement_suggestions) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Catatan Penolakan
                  </h4>
                  {selectedProposal.rejection_reason && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Alasan Penolakan</p>
                      <p className="text-sm text-red-800 whitespace-pre-wrap">{selectedProposal.rejection_reason}</p>
                    </div>
                  )}
                  {selectedProposal.improvement_suggestions && (
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-1">Saran Perbaikan</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedProposal.improvement_suggestions}</p>
                    </div>
                  )}
                </div>
              )}

              {!!selectedProposal.approvals?.length && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Catatan Persetujuan</h4>
                  <div className="space-y-3">
                    {selectedProposal.approvals.map((approval) => (
                      <div key={approval.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {approval.approver?.full_name || 'Approver'}
                            </p>
                            <p className="text-xs text-gray-500">{approval.approver?.role || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{approval.status}</p>
                            <p className="text-xs text-gray-500">{formatDate(approval.created_at)}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                          {approval.notes?.trim() || 'Tidak ada catatan.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProposal.payment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Informasi Pembayaran
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Status</span>
                      <span className="font-medium text-green-900">{getPaymentStatusLabel(selectedProposal.payment.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Penerima</span>
                      <span className="font-medium text-green-900">{selectedProposal.payment.recipient_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Metode</span>
                      <span className="font-medium text-green-900 capitalize">{selectedProposal.payment.payment_method}</span>
                    </div>
                    {selectedProposal.payment.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Tanggal Selesai</span>
                        <span className="font-medium text-green-900">{formatDate(selectedProposal.payment.completed_at)}</span>
                      </div>
                    )}
                  </div>

                  {selectedProposal.payment.payment_proof_file && (
                    <button
                      onClick={() => handleDownloadProof(selectedProposal.payment as Payment)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Download className="h-4 w-4" />
                      Unduh Bukti Pembayaran
                    </button>
                  )}

                  {selectedProposal.payment.admin_notes && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-green-700 mb-1">Catatan Bendahara</p>
                      <p className="text-sm text-green-900 whitespace-pre-wrap">{selectedProposal.payment.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={() => navigate(`/proposals/${selectedProposal.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Detail Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <XCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Proposal Ditolak</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedProposal.title}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">Alasan Penolakan</h4>
                <p className="text-red-800 whitespace-pre-wrap">
                  {selectedProposal.rejection_reason || 'Tidak ada alasan penolakan.'}
                </p>
              </div>

              {selectedProposal.improvement_suggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Saran Perbaikan</h4>
                  <p className="text-blue-800 whitespace-pre-wrap">{selectedProposal.improvement_suggestions}</p>
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-1 mb-6">
                {selectedProposal.rejected_by_user && (
                  <p>
                    Ditolak oleh:
                    <strong className="text-gray-900"> {selectedProposal.rejected_by_user.full_name}</strong>
                  </p>
                )}
                {selectedProposal.rejected_at && (
                  <p>
                    Tanggal:
                    <strong className="text-gray-900"> {formatDate(selectedProposal.rejected_at)}</strong>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                {(selectedProposal.status === 'rejected') && (
                  <button
                    onClick={() => navigate(`/proposals/${selectedProposal.id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Proposal
                  </button>
                )}
                <button
                  onClick={closeModals}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
