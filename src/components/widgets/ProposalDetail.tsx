import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiService, Proposal } from '../../services/api';
import { ArrowLeft, Edit, Trash2, User, Calendar, FileText, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';

const ProposalDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'delete' | 'submit' | null }>(
    { isOpen: false, action: null }
  );

  useEffect(() => {
    if (id) {
      fetchProposal(id);
    }
  }, [id]);

  const fetchProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProposalById(proposalId);
      setProposal(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat proposal';
      setError(errorMessage);
      console.error('Error fetching proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: true, action: 'delete' });
  };

  const handleDeleteConfirm = async () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: false, action: null });
    try {
      await apiService.deleteProposal(proposal.id);
      setToast({ type: 'success', message: 'Proposal berhasil dihapus' });
      navigate('/proposal-tracking');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus proposal';
      setToast({ type: 'error', message: errorMessage });
    }
  };

  const handleSubmitRequest = () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: true, action: 'submit' });
  };

  const handleSubmitConfirm = async () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: false, action: null });
    try {
      setSubmitting(true);
      const result = await apiService.submitProposal(proposal.id);
      setToast({ type: 'success', message: result?.message || 'Proposal berhasil diajukan' });
      await fetchProposal(proposal.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengajukan proposal';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      verified: 'bg-cyan-100 text-cyan-800',
      approved: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      final_approved: 'bg-green-100 text-green-800',
      payment_processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
    };
    
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Menunggu Verifikasi',
      verified: 'Terverifikasi',
      approved: 'Disetujui Kepala',
      rejected: 'Ditolak',
      final_approved: 'Disetujui Akhir',
      payment_processing: 'Proses Pembayaran',
      completed: 'Selesai',
    };
    
    return (
      <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error || 'Proposal tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/proposal-tracking')}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/proposal-tracking')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Proposal</h1>
            <p className="text-gray-600 mt-1">Informasi lengkap proposal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {proposal.status !== 'draft' && (
            <Link
              to={`/proposals/${proposal.id}/approval`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CheckCircle size={16} />
              Approval Workflow
            </Link>
          )}
          {proposal.status === 'draft' && user?.role === 'Pengusul' && (
            <>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {submitting ? 'Mengirim...' : 'Ajukan Proposal'}
              </button>
              <Link
                to={`/proposals/${proposal.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit size={16} />
                Edit
              </Link>
              <button
                onClick={handleDeleteRequest}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'delete' ? 'Hapus Proposal' : 'Ajukan Proposal'}
        message={confirmModal.action === 'delete' ? 'Apakah Anda yakin ingin menghapus proposal ini?' : 'Apakah Anda yakin ingin mengajukan proposal ini untuk verifikasi?'}
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
        confirmText={confirmModal.action === 'delete' ? 'Ya, Hapus' : 'Ya, Ajukan'}
        cancelText="Batal"
        onConfirm={confirmModal.action === 'delete' ? handleDeleteConfirm : handleSubmitConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, action: null })}
        loading={submitting}
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Title and Status */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{proposal.title}</h2>
              {proposal.description && (
                <p className="text-gray-600 mt-2">{proposal.description}</p>
              )}
            </div>
            <div className="ml-4">
              {getStatusBadge(proposal.status)}
            </div>
          </div>
        </div>

        {/* Jumlah Pengajuan (Featured) */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Jumlah Pengajuan</p>
          <p className="text-3xl font-bold text-blue-900">{formatRupiah(proposal.jumlah_pengajuan)}</p>
        </div>

        {/* RKAM Information */}
        {proposal.rkam && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-gray-400" size={20} />
              <h3 className="font-semibold text-gray-900">Informasi RKAM</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kategori</p>
                  <p className="font-medium text-gray-900">{proposal.rkam.kategori}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Item</p>
                  <p className="font-medium text-gray-900">{proposal.rkam.item_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Pagu</p>
                  <p className="font-medium text-gray-900">{formatRupiah(proposal.rkam.pagu)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terpakai</p>
                  <p className="font-medium text-gray-900">{formatRupiah(proposal.rkam.terpakai)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sisa</p>
                  <p className="font-bold text-green-600">{formatRupiah(proposal.rkam.sisa)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        {proposal.user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-gray-400" size={20} />
              <h3 className="font-semibold text-gray-900">Pembuat Proposal</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{proposal.user.name}</p>
              <p className="text-sm text-gray-600">{proposal.user.email}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-900">Timeline</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dibuat</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(proposal.created_at)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Terakhir Diubah</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(proposal.updated_at)}</span>
            </div>
            {proposal.submitted_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diajukan</span>
                <span className="text-sm font-medium text-blue-600">{formatDate(proposal.submitted_at)}</span>
              </div>
            )}
            {proposal.verified_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diverifikasi</span>
                <span className="text-sm font-medium text-indigo-600">{formatDate(proposal.verified_at)}</span>
              </div>
            )}
            {proposal.approved_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disetujui Kepala</span>
                <span className="text-sm font-medium text-purple-600">{formatDate(proposal.approved_at)}</span>
              </div>
            )}
            {proposal.final_approved_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disetujui Akhir</span>
                <span className="text-sm font-medium text-green-600">{formatDate(proposal.final_approved_at)}</span>
              </div>
            )}
            {proposal.completed_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Selesai</span>
                <span className="text-sm font-medium text-emerald-600">{formatDate(proposal.completed_at)}</span>
              </div>
            )}
            {proposal.rejected_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ditolak</span>
                <span className="text-sm font-medium text-red-600">{formatDate(proposal.rejected_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Committee Requirement & Rejection Reason */}
        {(proposal.requires_committee_approval || proposal.rejection_reason) && (
          <div className="p-6 border-t border-gray-200">
            {proposal.requires_committee_approval && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ Proposal ini memerlukan persetujuan Komite Madrasah
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Jumlah pengajuan melebihi Rp 50.000.000
                </p>
              </div>
            )}
            {proposal.rejection_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">Alasan Penolakan</p>
                <p className="text-sm text-red-700">{proposal.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back Link removed - header has back button */}
    </div>
  );
};

export default ProposalDetail;
