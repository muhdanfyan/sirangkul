import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiService, Proposal } from '../../services/api';
import { ArrowLeft, Edit, Trash2, User, Calendar, FileText, CheckCircle, Send, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';
import RejectionModal from '../../components/RejectionModal';

const ProposalDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'delete' | 'submit' | 'approve' | null }>(
    { isOpen: false, action: null }
  );
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const MAX_FETCH_ATTEMPTS = 3;

  useEffect(() => {
    // Only fetch once when component mounts or ID changes
    if (id) {
      console.log('🔷 useEffect triggered for ID:', id);
      fetchProposal(id);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      console.log('🧹 Cleanup: Component unmounting or ID changed');
    };
  }, [id]); // Only dependency is ID

  const fetchProposal = async (proposalId: string) => {
    // Prevent concurrent requests
    if (isFetching) {
      console.log('⚠️ Already fetching, skipping duplicate request...');
      return;
    }
    
    // Check retry limit
    if (fetchAttempts >= MAX_FETCH_ATTEMPTS) {
      console.error('❌ Max fetch attempts reached, not retrying');
      setError(`Gagal memuat proposal setelah ${MAX_FETCH_ATTEMPTS} percobaan. Silakan refresh halaman.`);
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      
      console.log(`📡 Fetching proposal (attempt ${fetchAttempts + 1}/${MAX_FETCH_ATTEMPTS})...`);
      const currentAttempt = fetchAttempts + 1;
      setFetchAttempts(currentAttempt);
      const data = await apiService.getProposalById(proposalId);
      
      // Validate proposal data structure
      if (!data || !data.id) {
        throw new Error('Data proposal tidak valid');
      }
      
      setProposal(data);
      
      // Debug info
      console.log('📋 Proposal loaded:', {
        id: data.id,
        title: data.title,
        status: data.status,
        userRole: user?.role,
        hasRejectionInfo: !!data.rejected_by_user,
        rejectedByRole: data.rejected_by_role,
        canShowSubmitButton: data.status === 'draft' && user?.role === 'Pengusul'
      });
      
      // Check rejection permission after proposal is loaded
      setTimeout(() => {
        const canReject = canRejectProposal();
        console.log('🎯 Can reject after load:', canReject);
      }, 100);
    } catch (err) {
      let errorMessage = 'Gagal memuat proposal';
      
      if (err instanceof Error) {
        // Handle specific error messages from backend
        if (err.message.includes('Server error')) {
          errorMessage = 'Terjadi kesalahan pada server. Silakan hubungi administrator.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('❌ Error fetching proposal (attempt ' + fetchAttempts + '):', err);
      
      // Show toast notification for better UX
      setToast({
        type: 'error',
        message: errorMessage
      });
      
      // Check if max attempts reached
      if (fetchAttempts >= MAX_FETCH_ATTEMPTS - 1) {
        console.error(`❌ Max fetch attempts (${MAX_FETCH_ATTEMPTS}) reached. Stopping retries.`);
        setToast({
          type: 'error',
          message: 'Gagal memuat proposal setelah beberapa percobaan. Silakan refresh halaman atau hubungi administrator.'
        });
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
      console.log('✅ Fetch completed, isFetching reset to false');
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

  const handleRejectWithImprovements = async (reason: string, improvements: string) => {
    if (!proposal) return;
    
    try {
      setRejecting(true);
      await apiService.rejectProposal(proposal.id, {
        rejection_reason: reason,
        improvement_suggestions: improvements
      });
      
      setToast({ 
        type: 'success', 
        message: 'Proposal berhasil ditolak dengan saran perbaikan' 
      });
      
      setShowRejectionModal(false);
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menolak proposal';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setRejecting(false);
    }
  };

  const handleApproveRequest = () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: true, action: 'approve' });
  };

  const handleApproveConfirm = async () => {
    if (!proposal) return;
    setConfirmModal({ isOpen: false, action: null });
    
    try {
      setApproving(true);
      const userRole = user?.role;
      let result;
      let successMessage = 'Proposal berhasil disetujui';
      
      if (userRole === 'Verifikator') {
        result = await apiService.verifyProposal(proposal.id);
        successMessage = 'Proposal berhasil diverifikasi';
      } else if (userRole === 'Kepala Madrasah') {
        result = await apiService.approveProposal(proposal.id);
        successMessage = 'Proposal berhasil disetujui Kepala Madrasah';
      } else if (userRole === 'Komite Madrasah') {
        result = await apiService.finalApproveProposal(proposal.id);
        successMessage = 'Proposal berhasil disetujui Komite Madrasah';
      }
      
      setToast({ 
        type: 'success', 
        message: result?.message || successMessage 
      });
      
      await fetchProposal(proposal.id);
    } catch (err) {
      console.error('Error approving proposal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyetujui proposal';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setApproving(false);
    }
  };

  const canApproveProposal = () => {
    if (!user || !proposal) return false;
    
    const userRole = user.role;
    const proposalStatus = proposal.status?.toLowerCase();
    
    // Verifikator can approve if status is submitted
    if (userRole === 'Verifikator' && proposalStatus === 'submitted') {
      return true;
    }
    
    // Kepala Madrasah can approve if status is verified
    if (userRole === 'Kepala Madrasah' && proposalStatus === 'verified') {
      return true;
    }
    
    // Komite can approve if status is approved and requires committee
    if (userRole === 'Komite Madrasah' && proposalStatus === 'approved' && proposal.requires_committee_approval) {
      return true;
    }
    
    // Note: Bendahara does NOT approve, they process payment in Payment Management page
    
    return false;
  };

  const canRejectProposal = () => {
    if (!user || !proposal) return false;
    
    const userRole = user.role;
    const proposalStatus = proposal.status?.toLowerCase();
    
    // Debug log
    console.log('🔍 Checking rejection permission:', {
      userRole,
      proposalStatus: proposal.status,
      proposalStatusLower: proposalStatus,
      requiresCommittee: proposal.requires_committee_approval
    });
    
    // Verifikator can reject if status is submitted
    if (userRole === 'Verifikator' && proposalStatus === 'submitted') {
      console.log('✅ Verifikator can reject');
      return true;
    }
    
    // Kepala Madrasah can reject if status is verified
    if (userRole === 'Kepala Madrasah' && proposalStatus === 'verified') {
      console.log('✅ Kepala Madrasah can reject');
      return true;
    }
    
    // Komite can reject if status is approved and requires committee
    if (userRole === 'Komite Madrasah' && proposalStatus === 'approved' && proposal.requires_committee_approval) {
      console.log('✅ Komite can reject');
      return true;
    }
    
    // Note: Bendahara does NOT reject proposals, they reject payments in Payment Management page
    
    console.log('❌ User cannot reject this proposal');
    return false;
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
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? 'Gagal Memuat Proposal' : 'Proposal Tidak Ditemukan'}
          </h3>
          <p className="text-red-600 mb-4">{error || 'Proposal tidak ditemukan'}</p>
          {fetchAttempts >= MAX_FETCH_ATTEMPTS && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
              <p className="text-sm text-orange-700">
                ⚠️ Sudah mencoba {MAX_FETCH_ATTEMPTS}x fetch. Kemungkinan masalah di backend server.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Silakan cek: <code className="bg-orange-100 px-1">storage/logs/laravel.log</code>
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            {error && (
              <button
                onClick={() => {
                  console.log('🔄 Manual retry button clicked');
                  setFetchAttempts(0);
                  setError(null);
                  setIsFetching(false);
                  if (id) fetchProposal(id);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading || isFetching}
              >
                {loading || isFetching ? 'Memuat...' : '🔄 Coba Lagi'}
              </button>
            )}
            <button
              onClick={() => navigate('/proposal-tracking')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ← Kembali ke Daftar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Jika masalah terus berlanjut, silakan hubungi administrator atau cek dokumentasi backend.
          </p>
        </div>
      </div>
    );
  }

  // Debug: Log proposal status and user role for troubleshooting buttons visibility
  console.log('🐛 Proposal Detail Render Debug:', {
    proposalId: proposal.id,
    proposalStatus: proposal.status,
    proposalStatusLower: proposal.status?.toLowerCase(),
    userRole: user?.role,
    isDraft: proposal.status?.toLowerCase() === 'draft',
    isRejected: proposal.status?.toLowerCase() === 'rejected',
    isPengusul: user?.role === 'Pengusul',
    shouldShowRejectedButtons: proposal.status?.toLowerCase() === 'rejected' && user?.role === 'Pengusul'
  });

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
          {canApproveProposal() && (
            <button
              onClick={handleApproveRequest}
              disabled={approving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              {approving ? 'Memproses...' : 'Setujui Proposal'}
            </button>
          )}
          {canRejectProposal() && (
            <button
              onClick={() => {
                console.log('🔴 Reject button clicked');
                setShowRejectionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle size={16} />
              Tolak Proposal
            </button>
          )}
          {/* Draft: Submit, Edit, Delete buttons */}
          {proposal.status?.toLowerCase() === 'draft' && user?.role === 'Pengusul' && (
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
          {/* Rejected: Edit and Submit button (so pengusul can fix and resubmit) */}
          {proposal.status?.toLowerCase() === 'rejected' && user?.role === 'Pengusul' && (
            <>
              <button
                onClick={() => {
                  console.log('🔄 Ajukan Ulang button clicked for rejected proposal');
                  handleSubmitRequest();
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {submitting ? 'Mengirim...' : 'Ajukan Ulang'}
              </button>
              <Link
                to={`/proposals/${proposal.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => console.log('✏️ Edit Proposal button clicked for rejected proposal')}
              >
                <Edit size={16} />
                Edit Proposal
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.action === 'delete' ? 'Hapus Proposal' : 
          confirmModal.action === 'approve' ? 'Setujui Proposal' : 
          'Ajukan Proposal'
        }
        message={
          confirmModal.action === 'delete' ? 'Apakah Anda yakin ingin menghapus proposal ini?' : 
          confirmModal.action === 'approve' ? 'Apakah Anda yakin ingin menyetujui proposal ini?' : 
          'Apakah Anda yakin ingin mengajukan proposal ini untuk verifikasi?'
        }
        type={
          confirmModal.action === 'delete' ? 'danger' : 
          confirmModal.action === 'approve' ? 'success' : 
          'warning'
        }
        confirmText={
          confirmModal.action === 'delete' ? 'Ya, Hapus' : 
          confirmModal.action === 'approve' ? 'Ya, Setujui' : 
          'Ya, Ajukan'
        }
        cancelText="Batal"
        onConfirm={
          confirmModal.action === 'delete' ? handleDeleteConfirm : 
          confirmModal.action === 'approve' ? handleApproveConfirm : 
          handleSubmitConfirm
        }
        onCancel={() => setConfirmModal({ isOpen: false, action: null })}
        loading={submitting || approving}
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
        {(proposal.requires_committee_approval || proposal.rejection_reason || proposal.improvement_suggestions) && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            {proposal.requires_committee_approval && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <XCircle size={16} />
                  Alasan Penolakan
                </p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{proposal.rejection_reason}</p>
                
                {/* Show rejector info for Pengusul */}
                {user?.role === 'Pengusul' && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-600 mb-1">
                      <span className="font-semibold">Ditolak oleh:</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-red-500" />
                      <span className="text-xs text-red-700">
                        {/* Prioritize rejected_by_user data, fallback to rejected_by_role */}
                        {proposal.rejected_by_user?.full_name 
                          ? `${proposal.rejected_by_user.full_name} (${proposal.rejected_by_user.role || proposal.rejected_by_role || 'Role tidak diketahui'})` 
                          : proposal.rejected_by_role 
                            ? `Role: ${proposal.rejected_by_role}`
                            : 'Informasi penolak tidak tersedia'}
                      </span>
                    </div>
                    {proposal.rejected_at && (
                      <p className="text-xs text-red-500 mt-1">
                        📅 {formatDate(proposal.rejected_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {proposal.improvement_suggestions && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Saran Perbaikan Proposal
                </p>
                <p className="text-sm text-blue-700 whitespace-pre-wrap leading-relaxed">{proposal.improvement_suggestions}</p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    💡 Silakan perbaiki proposal sesuai saran di atas dan ajukan kembali
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectWithImprovements}
        isLoading={rejecting}
        proposalTitle={proposal.title}
        userRole={(user?.role === 'Verifikator' ? 'verifikator' : 
                   user?.role === 'Kepala Madrasah' ? 'kepala_madrasah' : 
                   user?.role === 'Komite Madrasah' ? 'komite_madrasah' : 
                   'bendahara') as 'verifikator' | 'kepala_madrasah' | 'komite_madrasah' | 'bendahara'}
      />

      {/* Back Link removed - header has back button */}
    </div>
  );
};

export default ProposalDetail;
