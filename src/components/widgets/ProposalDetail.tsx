import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Paperclip,
  Send,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { apiService, Proposal, ProposalAttachment } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import RejectionModal from '../../components/RejectionModal';
import SectionAccordion from '../../components/SectionAccordion';
import Toast from '../../components/Toast';
import { canApproveProposalForUser, canRejectProposalForUser } from '../../utils/proposalWorkflow';
import { getPaymentStatusLabel, isPaymentCompleted } from '../../utils/paymentStatus';
import { applyCompletedPaymentUsageToRKAM } from '../../utils/rkamBudget';

type ToastState = {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

const ProposalDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'delete' | 'submit' | null }>({
    isOpen: false,
    action: null,
  });
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [previewAttachment, setPreviewAttachment] = useState<ProposalAttachment | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposal(id);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const fetchProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [proposalResult, paymentResult] = await Promise.allSettled([
        apiService.getProposalById(proposalId),
        apiService.getAllPayments(),
      ]);

      if (proposalResult.status !== 'fulfilled') {
        throw proposalResult.reason;
      }

      let nextProposal = proposalResult.value;

      if (paymentResult.status === 'fulfilled' && nextProposal.rkam) {
        const [normalizedRkam] = applyCompletedPaymentUsageToRKAM([nextProposal.rkam], paymentResult.value);
        nextProposal = {
          ...nextProposal,
          rkam: normalizedRkam,
        };
      } else if (paymentResult.status === 'rejected') {
        console.warn('Failed to sync completed payment usage for proposal detail:', paymentResult.reason);
      }

      setProposal(nextProposal);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat proposal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/proposal-tracking');
  };

  const handleDeleteConfirm = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      await apiService.deleteProposal(proposal.id);
      setConfirmModal({ isOpen: false, action: null });
      setToast({ type: 'success', message: 'Proposal berhasil dihapus.' });
      navigate('/proposal-tracking');
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus proposal',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitConfirm = async () => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      const result = await apiService.submitProposal(proposal.id);
      setConfirmModal({ isOpen: false, action: null });
      setToast({
        type: 'success',
        message: result?.message || 'Proposal berhasil diajukan.',
      });
      await fetchProposal(proposal.id);
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengajukan proposal',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!proposal || !user) return;

    try {
      setActionLoading(true);

      const notes = approvalNotes.trim() || undefined;
      let message = 'Proposal berhasil disetujui.';

      if (user.role === 'Verifikator' && proposal.status === 'submitted') {
        const result = await apiService.verifyProposal(proposal.id, { notes });
        message = result.message || message;
      } else if (user.role === 'Komite Madrasah' && proposal.status === 'verified') {
        const result = await apiService.approveProposal(proposal.id, { notes });
        message = result.message || message;
      } else if (user.role === 'Kepala Madrasah' && proposal.status === 'approved') {
        const result = await apiService.finalApproveProposal(proposal.id, { notes });
        message = result.message || message;
      } else {
        throw new Error('Aksi persetujuan tidak tersedia untuk status proposal ini.');
      }

      setShowApprovalModal(false);
      setApprovalNotes('');
      setToast({ type: 'success', message });
      await fetchProposal(proposal.id);
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memproses persetujuan',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithImprovements = async (reason: string, improvements: string) => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      await apiService.rejectProposal(proposal.id, {
        rejection_reason: reason,
        improvement_suggestions: improvements,
      });

      setShowRejectionModal(false);
      setToast({
        type: 'success',
        message: 'Proposal berhasil ditolak dan catatan perbaikan telah dikirim.',
      });
      await fetchProposal(proposal.id);
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menolak proposal',
      });
    } finally {
      setActionLoading(false);
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
      submitted: 'Menunggu Verifikator',
      verified: 'Menunggu Komite Madrasah',
      approved: 'Menunggu Kepala Madrasah',
      rejected: 'Ditolak',
      final_approved: 'Siap Dibayar',
      payment_processing: 'Proses Pembayaran',
      completed: 'Sudah Terbayar',
    };

    return (
      <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency?: Proposal['urgency']) => {
    if (!urgency) return null;

    const tone = urgency === 'Mendesak'
      ? 'bg-red-100 text-red-700'
      : urgency === 'Tinggi'
        ? 'bg-orange-100 text-orange-700'
        : urgency === 'Normal'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700';

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
        Urgensi {urgency}
      </span>
    );
  };

  const formatRupiah = (amount: string | number | undefined | null) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount || 0;

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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'DOC';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS';
    return 'FILE';
  };

  const getAttachmentTypeLabel = (attachmentType?: string | null) => {
    if (attachmentType === 'proposal') return 'File Proposal';
    if (attachmentType === 'lpj') return 'File LPJ';
    return 'Lampiran';
  };

  const getRoleLabel = (role?: string | null) => {
    switch (role) {
      case 'administrator':
      case 'Administrator':
        return 'Administrator';
      case 'pengusul':
      case 'Pengusul':
        return 'Pengusul';
      case 'verifikator':
      case 'Verifikator':
        return 'Verifikator';
      case 'kepala_madrasah':
      case 'Kepala Madrasah':
        return 'Kepala Madrasah';
      case 'komite_madrasah':
      case 'komite':
      case 'Komite Madrasah':
        return 'Komite Madrasah';
      case 'bendahara':
      case 'Bendahara':
        return 'Bendahara';
      default:
        return role || '-';
    }
  };

  const handlePreview = async (attachment: ProposalAttachment) => {
    if (attachment.mime_type !== 'application/pdf') {
      handleDownload(attachment);
      return;
    }

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }

    setPreviewAttachment(attachment);
    setPreviewBlobUrl(null);
    setPreviewLoading(true);

    try {
      const blobUrl = await apiService.fetchAttachmentBlobUrl(attachment.id);
      setPreviewBlobUrl(blobUrl);
    } catch (err) {
      setPreviewAttachment(null);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat pratinjau file',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }

    setPreviewBlobUrl(null);
    setPreviewAttachment(null);
  };

  const handleDownload = async (attachment: ProposalAttachment) => {
    try {
      setDownloadingId(attachment.id);
      await apiService.downloadAttachment(attachment.id, attachment.file_name);
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunduh lampiran',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <XCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          {error ? 'Gagal Memuat Proposal' : 'Proposal Tidak Ditemukan'}
        </h3>
        <p className="mt-2 text-red-700">{error || 'Proposal tidak ditemukan.'}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => id && fetchProposal(id)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Coba Lagi
          </button>
          <button
            onClick={handleBack}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const canApprove = canApproveProposalForUser(user, proposal);
  const canReject = canRejectProposalForUser(user, proposal);
  const approvalCount = proposal.approvals?.length || 0;

  const timelineItems = [
    { label: 'Dibuat', value: proposal.created_at, tone: 'text-gray-900' },
    { label: 'Terakhir Diubah', value: proposal.updated_at, tone: 'text-gray-900' },
    { label: 'Diajukan', value: proposal.submitted_at, tone: 'text-blue-700' },
    { label: 'Diverifikasi', value: proposal.verified_at, tone: 'text-cyan-700' },
    { label: 'Disetujui Komite Madrasah', value: proposal.approved_at, tone: 'text-purple-700' },
    { label: 'Disetujui Kepala Madrasah', value: proposal.final_approved_at, tone: 'text-green-700' },
    { label: 'Pembayaran Selesai', value: proposal.completed_at, tone: 'text-emerald-700' },
    { label: 'Ditolak', value: proposal.rejected_at, tone: 'text-red-700' },
  ].filter((item) => item.value);

  const showPaymentSection = Boolean(proposal.payment)
    || ['final_approved', 'payment_processing', 'completed'].includes(proposal.status);

  const paymentStatusLabel = getPaymentStatusLabel(
    proposal.payment?.status
      || (proposal.status === 'completed'
        ? 'completed'
        : proposal.status === 'payment_processing'
          ? 'processing'
          : proposal.status === 'final_approved'
            ? 'pending'
            : undefined),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Proposal</h1>
            <p className="mt-1 text-gray-600">Tinjau proposal, dokumen, timeline, dan riwayat persetujuan.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <CheckCircle size={16} />
              Setujui Proposal
            </button>
          )}

          {canReject && (
            <button
              onClick={() => setShowRejectionModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              <XCircle size={16} />
              Tolak Proposal
            </button>
          )}

          {proposal.status === 'draft' && user?.role === 'Pengusul' && (
            <>
              <button
                onClick={() => setConfirmModal({ isOpen: true, action: 'submit' })}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {actionLoading ? 'Mengirim...' : 'Ajukan Proposal'}
              </button>
              <Link
                to={`/proposals/${proposal.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
              >
                <Edit size={16} />
                Edit
              </Link>
              <button
                onClick={() => setConfirmModal({ isOpen: true, action: 'delete' })}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </>
          )}

          {proposal.status === 'rejected' && user?.role === 'Pengusul' && (
            <>
              <button
                onClick={() => setConfirmModal({ isOpen: true, action: 'submit' })}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {actionLoading ? 'Mengirim...' : 'Ajukan Ulang'}
              </button>
              <Link
                to={`/proposals/${proposal.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
              >
                <Edit size={16} />
                Edit Proposal
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(proposal.status)}
                {getUrgencyBadge(proposal.urgency)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{proposal.title}</h2>
                {proposal.description && (
                  <p className="mt-2 max-w-3xl text-gray-600">{proposal.description}</p>
                )}
              </div>
            </div>

            <div className="min-w-full rounded-2xl border border-blue-200 bg-white/90 p-5 xl:min-w-[320px] xl:max-w-sm">
              <p className="text-sm font-medium text-blue-600">Jumlah Pengajuan</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">
                {formatRupiah(proposal.jumlah_pengajuan)}
              </p>
              {proposal.requires_committee_approval && (
                <p className="mt-3 text-sm text-amber-700">
                  Proposal ini akan melewati tahap persetujuan komite sesuai alur bidang.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <div className="space-y-6">
            <SectionAccordion
              title="Informasi RKAM"
              icon={<FileText size={18} />}
              defaultOpen
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Data RKAM</p>
                  {proposal.rkam ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Bidang</p>
                        <p className="font-semibold text-gray-900">{proposal.rkam.bidang || proposal.rkam.kategori}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Item</p>
                        <p className="font-semibold text-gray-900">{proposal.rkam.item_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tahun Anggaran</p>
                        <p className="font-semibold text-gray-900">{proposal.rkam.tahun_anggaran || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Deskripsi RKAM</p>
                        <p className="font-semibold text-gray-900">{proposal.rkam.deskripsi || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-600">Informasi RKAM belum tersedia.</p>
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pembuat Proposal</p>
                  {proposal.user ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nama</p>
                        <p className="font-semibold text-gray-900">
                          {proposal.user.full_name || proposal.user.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{proposal.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-semibold text-gray-900">{getRoleLabel(proposal.user.role)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-600">Informasi pembuat proposal belum tersedia.</p>
                  )}
                </div>
              </div>

              {proposal.rkam && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Pagu</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(proposal.rkam.pagu)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Terpakai</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{formatRupiah(proposal.rkam.terpakai)}</p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">Sisa</p>
                    <p className="mt-1 text-lg font-bold text-green-700">{formatRupiah(proposal.rkam.sisa)}</p>
                  </div>
                </div>
              )}

              {(proposal.urgency || proposal.start_date || proposal.end_date) && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Urgensi</p>
                    <p className="mt-1 font-semibold text-gray-900">{proposal.urgency || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Mulai Kegiatan</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatDate(proposal.start_date)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Selesai Kegiatan</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatDate(proposal.end_date)}</p>
                  </div>
                </div>
              )}
            </SectionAccordion>

            <SectionAccordion
              title="Timeline"
              icon={<Calendar size={18} />}
              defaultOpen
            >
              {timelineItems.length > 0 ? (
                <div className="space-y-4">
                  {timelineItems.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">Status dan perubahan waktu proposal.</p>
                      </div>
                      <p className={`text-sm font-semibold ${item.tone}`}>{formatDate(item.value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Belum ada timeline yang dapat ditampilkan.</p>
              )}
            </SectionAccordion>

            <SectionAccordion
              title="Dokumen Pendukung"
              icon={<Paperclip size={18} />}
              badge={
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {proposal.attachments?.length || 0} file
                </span>
              }
              defaultOpen
            >
              {proposal.attachments && proposal.attachments.length > 0 ? (
                <div className="space-y-3">
                  {proposal.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xs font-bold text-blue-700 shadow-sm">
                        {getFileIcon(attachment.mime_type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                          {getAttachmentTypeLabel(attachment.attachment_type)}
                        </p>
                        <p className="truncate text-sm font-semibold text-gray-900">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(attachment)}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Eye size={16} />
                          Lihat
                        </button>
                        <button
                          onClick={() => handleDownload(attachment)}
                          disabled={downloadingId === attachment.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloadingId === attachment.id
                            ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            : <Download size={16} />}
                          Unduh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Belum ada dokumen pendukung yang diunggah.
                </div>
              )}
            </SectionAccordion>
          </div>

          <div className="space-y-6">
            <SectionAccordion
              title="Catatan Persetujuan"
              icon={<CheckCircle size={18} />}
              badge={
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {approvalCount} catatan
                </span>
              }
              defaultOpen
            >
              {proposal.approvals && proposal.approvals.length > 0 ? (
                <div className="space-y-3">
                  {proposal.approvals.map((approval) => (
                    <div key={approval.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getRoleLabel(approval.approver?.role)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {approval.approver?.full_name || 'Pengguna tidak diketahui'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {approval.status === 'approved'
                              ? 'Disetujui'
                              : approval.status === 'rejected'
                                ? 'Ditolak'
                                : 'Menunggu'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(approval.created_at)}</p>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                        {approval.notes?.trim() || 'Tidak ada catatan.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Belum ada catatan persetujuan untuk proposal ini.
                </div>
              )}
            </SectionAccordion>

            {showPaymentSection && (
              <SectionAccordion
                title="Status Pembayaran"
                icon={<DollarSign size={18} />}
                defaultOpen
              >
                <div
                  className={`rounded-xl border p-4 ${
                    isPaymentCompleted(proposal.payment)
                      ? 'border-emerald-200 bg-emerald-50'
                      : proposal.payment?.status === 'processing' || proposal.status === 'payment_processing'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      isPaymentCompleted(proposal.payment)
                        ? 'text-emerald-900'
                        : proposal.payment?.status === 'processing' || proposal.status === 'payment_processing'
                          ? 'text-yellow-900'
                          : 'text-blue-900'
                    }`}
                  >
                    {isPaymentCompleted(proposal.payment)
                      ? 'Proposal ini sudah terbayarkan.'
                      : proposal.payment?.status === 'processing' || proposal.status === 'payment_processing'
                        ? 'Pembayaran sedang diproses oleh bendahara.'
                        : 'Proposal sudah siap masuk ke tahap pembayaran.'}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      isPaymentCompleted(proposal.payment)
                        ? 'text-emerald-700'
                        : proposal.payment?.status === 'processing' || proposal.status === 'payment_processing'
                          ? 'text-yellow-800'
                          : 'text-blue-700'
                    }`}
                  >
                    {isPaymentCompleted(proposal.payment)
                      ? `Dana dibayarkan pada ${formatDate(proposal.payment?.completed_at || proposal.completed_at)}.`
                      : proposal.payment?.status === 'processing' || proposal.status === 'payment_processing'
                        ? 'Menunggu finalisasi pembayaran dan konfirmasi selesai.'
                        : 'Bendahara dapat mulai memproses pembayaran untuk proposal ini.'}
                  </p>
                </div>

                {proposal.payment && (
                  <>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Status Pembayaran</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{paymentStatusLabel}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Tanggal Selesai</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatDate(proposal.payment.completed_at || proposal.completed_at)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Penerima</p>
                        <p className="mt-1 font-semibold text-gray-900">{proposal.payment.recipient_name || '-'}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Metode</p>
                        <p className="mt-1 font-semibold capitalize text-gray-900">{proposal.payment.payment_method || '-'}</p>
                      </div>
                    </div>

                    {proposal.payment.admin_notes && (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-900">Catatan Bendahara</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{proposal.payment.admin_notes}</p>
                      </div>
                    )}
                  </>
                )}
              </SectionAccordion>
            )}

            {proposal.requires_committee_approval && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Tahap Komite Aktif</p>
                <p className="mt-1 text-sm text-amber-700">
                  Proposal pada alur baru akan diproses oleh verifikator, komite, lalu kepala madrasah dalam bidang yang sama.
                </p>
              </div>
            )}

            {(proposal.rejection_reason || proposal.improvement_suggestions) && (
              <div className="space-y-4">
                {proposal.rejection_reason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
                      <XCircle size={16} />
                      Alasan Penolakan
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-red-700">{proposal.rejection_reason}</p>
                    {(proposal.rejected_by_user || proposal.rejected_by_role) && (
                      <div className="mt-3 border-t border-red-200 pt-3 text-xs text-red-600">
                        Ditolak oleh{' '}
                        <span className="font-semibold">
                          {proposal.rejected_by_user?.full_name || getRoleLabel(proposal.rejected_by_role)}
                        </span>
                        {proposal.rejected_by_user?.role && (
                          <span> ({getRoleLabel(proposal.rejected_by_user.role)})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {proposal.improvement_suggestions && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                      <FileText size={16} />
                      Saran Perbaikan
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-blue-700">
                      {proposal.improvement_suggestions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'delete' ? 'Hapus Proposal' : 'Ajukan Proposal'}
        message={
          confirmModal.action === 'delete'
            ? 'Apakah Anda yakin ingin menghapus proposal ini?'
            : 'Apakah Anda yakin ingin mengajukan proposal ini untuk diproses lebih lanjut?'
        }
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
        confirmText={confirmModal.action === 'delete' ? 'Ya, Hapus' : 'Ya, Ajukan'}
        cancelText="Batal"
        onConfirm={confirmModal.action === 'delete' ? handleDeleteConfirm : handleSubmitConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, action: null })}
        loading={actionLoading}
      />

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Setujui Proposal</h3>
              <p className="mt-1 text-sm text-gray-600">
                Satu tombol ini langsung membuka form catatan persetujuan sebelum proposal disetujui.
              </p>
            </div>

            <div className="px-6 py-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Catatan Persetujuan
              </label>
              <textarea
                value={approvalNotes}
                onChange={(event) => setApprovalNotes(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Isi catatan jika diperlukan. Boleh dikosongkan."
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalNotes('');
                }}
                disabled={actionLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Ya, Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}

      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectWithImprovements}
        isLoading={actionLoading}
        proposalTitle={proposal.title}
        userRole={(user?.role === 'Verifikator'
          ? 'verifikator'
          : user?.role === 'Komite Madrasah'
            ? 'komite_madrasah'
            : user?.role === 'Kepala Madrasah'
              ? 'kepala_madrasah'
              : 'bendahara') as 'verifikator' | 'kepala_madrasah' | 'komite_madrasah' | 'bendahara'}
      />

      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
              <Paperclip size={18} className="shrink-0 text-gray-400" />
              <p className="flex-1 truncate text-sm font-medium text-gray-900">
                {previewAttachment.file_name}
              </p>
              <button
                onClick={() => handleDownload(previewAttachment)}
                disabled={downloadingId === previewAttachment.id}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Unduh"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleClosePreview}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Tutup"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex min-h-64 flex-1 items-center justify-center overflow-hidden bg-gray-100">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
                  <span className="text-sm">Memuat pratinjau...</span>
                </div>
              ) : previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  className="h-full w-full"
                  style={{ minHeight: '70vh' }}
                  title={previewAttachment.file_name}
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Pratinjau tidak tersedia untuk file ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProposalDetail;
