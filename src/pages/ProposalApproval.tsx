import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, Proposal } from '../services/api';
import { ArrowLeft, CheckCircle, XCircle, Send, FileText, User, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import RejectionModal from '../components/RejectionModal';

const ProposalApproval: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Toast & Confirm Modal states
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

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

  // Submit Proposal (by Pengusul)
  const handleSubmitProposal = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      const result = await apiService.submitProposal(proposal.id);
      setToast({ message: result.message, type: 'success' });
      await fetchProposal(proposal.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengajukan proposal';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openSubmitConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Submit Proposal',
      message: 'Apakah Anda yakin ingin mengajukan proposal ini? Proposal yang sudah diajukan tidak dapat diubah lagi.',
      type: 'info',
      onConfirm: () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        handleSubmitProposal();
      }
    });
  };

  // Verify Proposal (by Verifikator)
  const handleVerify = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      console.log('🔄 Verifying proposal:', proposal.id, 'Action:', modalAction);
      console.log('👤 Current user:', user);
      
      if (modalAction === 'approve') {
        // Call verify endpoint (no action field needed)
        const result = await apiService.verifyProposal(proposal.id, {});
        console.log('✅ Verify success:', result);
        setToast({ message: result.message, type: 'success' });
      }
      
      setShowModal(false);
      setNotes('');
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('❌ Verify failed:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        proposal_id: proposal.id,
        action: modalAction,
        user_role: user?.role
      });
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses verifikasi';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rejection with improvements (by Verifikator)
  const handleRejectWithImprovements = async (reason: string, improvements: string) => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      const result = await apiService.rejectProposal(proposal.id, {
        rejection_reason: reason,
        improvement_suggestions: improvements
      });
      console.log('✅ Reject success:', result);
      setToast({ message: result.message, type: 'success' });
      setShowRejectionModal(false);
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('❌ Reject failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menolak proposal';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Proposal (by Kepala Madrasah)
  const handleApprove = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      console.log('🔄 Approving proposal:', proposal.id, 'Action:', modalAction);
      console.log('👤 Current user:', user);
      
      if (modalAction === 'approve') {
        // Call approve endpoint (no action field needed)
        const result = await apiService.approveProposal(proposal.id, {});
        console.log('✅ Approve success:', result);
        setToast({ message: result.message, type: 'success' });
      }
      
      setShowModal(false);
      setNotes('');
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('❌ Approve failed:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        proposal_id: proposal.id,
        action: modalAction,
        user_role: user?.role
      });
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses persetujuan';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Final Approve Proposal (by Komite)
  const handleFinalApprove = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      console.log('🔄 Final approving proposal:', proposal.id, 'Action:', modalAction);
      console.log('👤 Current user:', user);
      
      if (modalAction === 'approve') {
        // Call final-approve endpoint (no action field needed)
        const result = await apiService.finalApproveProposal(proposal.id, {});
        console.log('✅ Final approve success:', result);
        setToast({ message: result.message, type: 'success' });
      }
      
      setShowModal(false);
      setNotes('');
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('❌ Final approve failed:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        proposal_id: proposal.id,
        action: modalAction,
        user_role: user?.role
      });
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses persetujuan akhir';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (action: 'approve' | 'reject') => {
    setModalAction(action);
    if (action === 'reject') {
      setShowRejectionModal(true);
    } else {
      setShowModal(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Menunggu Verifikasi' },
      verified: { color: 'bg-cyan-100 text-cyan-800', label: 'Terverifikasi' },
      approved: { color: 'bg-purple-100 text-purple-800', label: 'Disetujui Kepala' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
      final_approved: { color: 'bg-green-100 text-green-800', label: 'Disetujui Akhir' },
      payment_processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Proses Pembayaran' },
      completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Selesai' },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-4 py-2 text-sm font-medium rounded-full ${config.color}`}>
        {config.label}
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

  // Determine which action buttons to show based on role and status
  const canSubmit = user?.role === 'Pengusul' && proposal?.status === 'draft';
  const canVerify = user?.role === 'Verifikator' && proposal?.status === 'submitted';
  const canApprove = user?.role === 'Kepala Madrasah' && proposal?.status === 'verified';
  // Only Komite Madrasah can final approve if committee approval is required
  const canFinalApprove = user?.role === 'Komite Madrasah' && proposal?.status === 'approved' && proposal?.requires_committee_approval === true;

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
            <h1 className="text-2xl font-bold text-gray-900">Detail & Approval Proposal</h1>
            <p className="text-gray-600 mt-1">Review dan proses persetujuan</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canSubmit || canVerify || canApprove || canFinalApprove) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Aksi Diperlukan</p>
              <p className="text-sm text-blue-700 mt-1">
                {canSubmit && 'Anda dapat mengajukan proposal ini'}
                {canVerify && 'Proposal menunggu verifikasi Anda'}
                {canApprove && 'Proposal menunggu persetujuan Anda'}
                {canFinalApprove && 'Proposal menunggu persetujuan akhir dari Komite'}
              </p>
            </div>
            <div className="flex gap-2">
              {canSubmit && (
                <button
                  onClick={openSubmitConfirm}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  {actionLoading ? 'Mengirim...' : 'Ajukan Proposal'}
                </button>
              )}
              
              {(canVerify || canApprove || canFinalApprove) && (
                <>
                  <button
                    onClick={() => openModal('approve')}
                    disabled={actionLoading || (canFinalApprove && user?.role !== 'Komite Madrasah')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle size={16} />
                    Setujui
                  </button>
                  <button
                    onClick={() => openModal('reject')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle size={16} />
                    Tolak
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
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

        {/* Jumlah Pengajuan */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Jumlah Pengajuan</p>
          <p className="text-3xl font-bold text-blue-900">{formatRupiah(proposal.jumlah_pengajuan)}</p>
          {proposal.requires_committee_approval && (
            <p className="text-xs text-blue-600 mt-2">⚠️ Memerlukan persetujuan Komite Madrasah</p>
          )}
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

        {/* Pembuat Proposal */}
        {proposal.user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-gray-400" size={20} />
              <h3 className="font-semibold text-gray-900">Pembuat Proposal</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{proposal.user.full_name || proposal.user.name}</p>
              <p className="text-sm text-gray-600">{proposal.user.email}</p>
              {proposal.user.role && (
                <p className="text-xs text-gray-500 mt-1">Role: {proposal.user.role}</p>
              )}
            </div>
          </div>
        )}

        {/* Approval Timeline */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-900">Timeline Persetujuan</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${proposal.submitted_at ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Diajukan</p>
                <p className="text-xs text-gray-600">{formatDate(proposal.submitted_at)}</p>
              </div>
            </div>
            
            {proposal.verified_at && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Diverifikasi</p>
                  <p className="text-xs text-gray-600">{formatDate(proposal.verified_at)}</p>
                  {proposal.verifier && (
                    <p className="text-xs text-gray-500">oleh {proposal.verifier.full_name}</p>
                  )}
                </div>
              </div>
            )}
            
            {proposal.approved_at && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Disetujui Kepala Madrasah</p>
                  <p className="text-xs text-gray-600">{formatDate(proposal.approved_at)}</p>
                  {proposal.approver && (
                    <p className="text-xs text-gray-500">oleh {proposal.approver.full_name}</p>
                  )}
                </div>
              </div>
            )}
            
            {proposal.final_approved_at && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Disetujui Akhir</p>
                  <p className="text-xs text-gray-600">{formatDate(proposal.final_approved_at)}</p>
                  {proposal.final_approver && (
                    <p className="text-xs text-gray-500">oleh {proposal.final_approver.full_name}</p>
                  )}
                </div>
              </div>
            )}
            
              {proposal.rejected_at && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Ditolak</p>
                    <p className="text-xs text-red-600">{formatDate(proposal.rejected_at)}</p>
                    {proposal.rejection_reason && (
                      <div className="mt-2 space-y-2">
                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
                          <p className="font-semibold mb-1">Alasan Penolakan:</p>
                          <p>{proposal.rejection_reason}</p>
                        </div>
                        {proposal.improvement_suggestions && (
                          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                            <p className="font-semibold mb-1">Saran Perbaikan:</p>
                            <p>{proposal.improvement_suggestions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-gray-400" size={20} />
            <h3 className="font-semibold text-gray-900">Informasi Tambahan</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Dibuat</p>
              <p className="font-medium text-gray-900">{formatDate(proposal.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-600">Terakhir Diubah</p>
              <p className="font-medium text-gray-900">{formatDate(proposal.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Setujui Proposal
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Catatan opsional..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (canVerify) handleVerify();
                  else if (canApprove) handleApprove();
                  else if (canFinalApprove) handleFinalApprove();
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Memproses...' : 'Ya, Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectWithImprovements}
        proposalTitle={proposal?.title || ''}
        isLoading={actionLoading}
        userRole={
          canVerify ? 'verifikator' :
          canApprove ? 'kepala_madrasah' :
          canFinalApprove ? 'komite_madrasah' :
          'verifikator'
        }
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        loading={actionLoading}
      />
    </div>
  );
};

export default ProposalApproval;
