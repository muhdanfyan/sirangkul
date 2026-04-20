import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  apiService,
  ProposalAttachment,
  ProposalAttachmentUpload,
  ProposalCreateRequest,
  RKAM,
} from '../../services/api';
import { AlertCircle, CheckCircle, ArrowLeft, FileText, Upload, X } from 'lucide-react';
import { formatRupiah, parseAmountValue } from '../../utils/currency';
import { applyCompletedPaymentUsageToRKAM } from '../../utils/rkamBudget';

interface ProposalFormProps {
  isEdit?: boolean;
}

type AttachmentType = 'proposal' | 'lpj';

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const REQUIRED_ATTACHMENTS: Array<{
  key: AttachmentType;
  label: string;
  description: string;
}> = [
  {
    key: 'proposal',
    label: 'File Proposal',
    description: 'Dokumen proposal utama.',
  },
  {
    key: 'lpj',
    label: 'File LPJ',
    description: 'Dokumen LPJ pendukung.',
  },
];

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ProposalForm: React.FC<ProposalFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const toast = useToast();
  const todayString = getTodayDateString();

  const [rkams, setRkams] = useState<RKAM[]>([]);
  const [selectedRkam, setSelectedRkam] = useState<RKAM | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<ProposalAttachment[]>([]);
  const [attachments, setAttachments] = useState<Record<AttachmentType, File | null>>({
    proposal: null,
    lpj: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<AttachmentType, string | null>>({
    proposal: null,
    lpj: null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingRkams, setLoadingRkams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<ProposalCreateRequest>({
    rkam_id: '',
    title: '',
    description: '',
    jumlah_pengajuan: 0,
    urgency: 'Normal',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchRkams();
    if (isEdit && id) {
      fetchProposal(id);
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (!formData.rkam_id || rkams.length === 0) {
      return;
    }

    const matchedRkam = rkams.find((item) => item.id === formData.rkam_id);
    if (matchedRkam) {
      setSelectedRkam(matchedRkam);
    }
  }, [formData.rkam_id, rkams]);

  useEffect(() => {
    const state = (location.state as { toast?: { message: string; type?: 'success' | 'error' | 'info' | 'warning' } } | undefined) || undefined;
    if (state?.toast) {
      const notification = state.toast;
      toast(notification.message, notification.type ?? 'info');
      try {
        navigate(location.pathname, { replace: true, state: undefined });
      } catch {
        // ignore
      }
    }
  }, [location.pathname, navigate, toast]);

  const attachmentMap = existingAttachments.reduce<Record<string, ProposalAttachment>>((acc, item) => {
    if (item.attachment_type) {
      acc[item.attachment_type] = item;
    }
    return acc;
  }, {});

  const fetchRkams = async () => {
    try {
      setLoadingRkams(true);
      const [rkamResult, paymentResult] = await Promise.allSettled([
        apiService.getAllRKAM({ no_paginate: true }),
        apiService.getAllPayments(),
      ]);

      if (rkamResult.status !== 'fulfilled') {
        throw rkamResult.reason;
      }

      const data = Array.isArray(rkamResult.value) ? rkamResult.value : rkamResult.value?.data ?? [];
      const normalizedRkams = paymentResult.status === 'fulfilled'
        ? applyCompletedPaymentUsageToRKAM(data, paymentResult.value)
        : data;

      if (paymentResult.status === 'rejected') {
        console.warn('Failed to sync completed payment usage for RKAM form:', paymentResult.reason);
      }

      const availableRkams = normalizedRkams.filter((rkam: RKAM) => {
        const sisa = parseAmountValue(rkam.sisa);
        return sisa > 0;
      });
      setRkams(availableRkams);
    } catch (err) {
      console.error('Error fetching RKAMs:', err);
      setError('Gagal memuat data RKAM');
    } finally {
      setLoadingRkams(false);
    }
  };

  const fetchProposal = async (proposalId: string) => {
    try {
      setLoadingRkams(true);
      const proposal = await apiService.getProposalById(proposalId);
      setFormData({
        rkam_id: proposal.rkam_id,
        title: proposal.title,
        description: proposal.description || '',
        jumlah_pengajuan: typeof proposal.jumlah_pengajuan === 'string'
          ? parseFloat(proposal.jumlah_pengajuan)
          : proposal.jumlah_pengajuan,
        urgency: proposal.urgency ?? 'Normal',
        start_date: proposal.start_date ?? '',
        end_date: proposal.end_date ?? '',
      });

      setExistingAttachments(proposal.attachments || []);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Gagal memuat data proposal');
    } finally {
      setLoadingRkams(false);
    }
  };

  const handleRkamChange = (rkamId: string) => {
    const rkam = rkams.find((item) => item.id === rkamId);
    setSelectedRkam(rkam || null);
    setFormData((prev) => ({ ...prev, rkam_id: rkamId }));
  };

  const validateBudget = (): { isValid: boolean; message: string } => {
    if (!selectedRkam) {
      return { isValid: false, message: '' };
    }

    const sisa = parseAmountValue(selectedRkam.sisa);

    const requested = formData.jumlah_pengajuan;

    if (requested <= 0) {
      return { isValid: false, message: 'Jumlah pengajuan harus lebih dari 0' };
    }

    if (requested > sisa) {
      return {
        isValid: false,
        message: `Jumlah pengajuan melebihi sisa anggaran RKAM (${formatRupiah(sisa)})`,
      };
    }

    return { isValid: true, message: 'Jumlah pengajuan valid' };
  };

  const validateSelectedFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Ukuran file ${(file.size / 1024 / 1024).toFixed(2)} MB melebihi batas 1 MB.`;
    }

    return null;
  };

  const handleFileUpload = (type: AttachmentType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationMessage = validateSelectedFile(file);
    if (validationMessage) {
      setFileErrors((prev) => ({ ...prev, [type]: validationMessage }));
      event.target.value = '';
      return;
    }

    setAttachments((prev) => ({ ...prev, [type]: file }));
    setFileErrors((prev) => ({ ...prev, [type]: null }));
    event.target.value = '';
  };

  const handleRemoveFile = (type: AttachmentType) => {
    setAttachments((prev) => ({ ...prev, [type]: null }));
    setFileErrors((prev) => ({ ...prev, [type]: null }));
  };

  const validateAttachmentPresence = () => {
    for (const item of REQUIRED_ATTACHMENTS) {
      const hasExisting = !!attachmentMap[item.key];
      const hasNew = !!attachments[item.key];

      if (!hasExisting && !hasNew) {
        return `${item.label} wajib tersedia sebelum proposal disimpan.`;
      }
    }

    return null;
  };

  const validateDates = () => {
    if (!formData.start_date || !formData.end_date) {
      return 'Tanggal mulai dan tanggal selesai wajib diisi.';
    }

    if (formData.start_date > todayString) {
      return 'Tanggal mulai proposal tidak boleh melebihi hari ini.';
    }

    if (formData.end_date < formData.start_date) {
      return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
    }

    return null;
  };

  const getPendingUploads = (): ProposalAttachmentUpload[] =>
    REQUIRED_ATTACHMENTS
      .filter((item) => attachments[item.key])
      .map((item) => ({
        file: attachments[item.key] as File,
        attachmentType: item.key,
      }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const budgetValidation = validateBudget();
    if (!budgetValidation.isValid) {
      setError(budgetValidation.message);
      return;
    }

    const dateMessage = validateDates();
    if (dateMessage) {
      setError(dateMessage);
      return;
    }

    const attachmentMessage = validateAttachmentPresence();
    if (attachmentMessage) {
      setError(attachmentMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      if (isEdit && id) {
        await apiService.updateProposal(id, formData);

        const hasLegacyUntypedAttachments = existingAttachments.some((item) => !item.attachment_type);

        if (hasLegacyUntypedAttachments) {
          for (const attachment of existingAttachments) {
            await apiService.deleteAttachment(attachment.id);
          }
        } else {
          for (const item of REQUIRED_ATTACHMENTS) {
            if (!attachments[item.key]) {
              continue;
            }

            const existingAttachment = attachmentMap[item.key];
            if (existingAttachment) {
              await apiService.deleteAttachment(existingAttachment.id);
            }
          }
        }

        const uploads = getPendingUploads();
        if (uploads.length > 0) {
          await apiService.uploadProposalAttachments(id, uploads);
        }

        toast('Proposal berhasil diperbarui', 'success');
        navigate(`/proposals/${id}`, {
          state: {
            toast: { message: 'Proposal berhasil diperbarui', type: 'success' },
          },
        });
      } else {
        const createdProposal = await apiService.createProposal(formData);
        await apiService.uploadProposalAttachments(createdProposal.id, getPendingUploads());

        toast('Proposal berhasil dibuat', 'success');
        navigate('/proposal-tracking', {
          state: {
            toast: { message: 'Proposal berhasil dibuat', type: 'success' },
          },
        });
      }
    } catch (err: any) {
      const errorResponse = err?.response?.data;
      if (errorResponse?.errors) {
        setValidationErrors(errorResponse.errors as Record<string, string[]>);
        setError('Terdapat kesalahan pada form. Silakan periksa kembali.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan proposal';
        setError(errorMessage);
        toast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const budgetValidation = validateBudget();

  if (loadingRkams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Proposal' : 'Buat Proposal Baru'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Perbarui informasi proposal dan lampiran revisi' : 'Buat pengajuan proposal anggaran baru'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-600 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih RKAM <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.rkam_id}
            onChange={(e) => handleRkamChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isEdit}
          >
            <option value="">-- Pilih RKAM --</option>
            {rkams.map((rkam) => (
              <option key={rkam.id} value={rkam.id}>
                {rkam.kategori} - {rkam.item_name} (Sisa: {formatRupiah(rkam.sisa)})
              </option>
            ))}
          </select>
          {validationErrors.rkam_id && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.rkam_id[0]}</p>
          )}
        </div>

        {selectedRkam && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-blue-900">Informasi RKAM</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-600 font-medium">Pagu</p>
                <p className="text-blue-900">{formatRupiah(selectedRkam.pagu)}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Terpakai</p>
                <p className="text-blue-900">{formatRupiah(selectedRkam.terpakai)}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">Sisa</p>
                <p className="text-blue-900 font-bold">{formatRupiah(selectedRkam.sisa)}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Judul Proposal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Masukkan judul proposal"
            required
          />
          {validationErrors.title && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.title[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Masukkan deskripsi proposal"
            rows={4}
            required
          />
          {validationErrors.description && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.description[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tingkat Urgensi
            </label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as ProposalCreateRequest['urgency'] })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Rendah">Rendah</option>
              <option value="Normal">Normal</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Mendesak">Mendesak</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Pengajuan <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.jumlah_pengajuan}
            onChange={(e) => setFormData({ ...formData, jumlah_pengajuan: parseFloat(e.target.value) || 0 })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            required
            min="0"
            step="1000"
          />
          {validationErrors.jumlah_pengajuan && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.jumlah_pengajuan[0]}</p>
          )}

          {selectedRkam && formData.jumlah_pengajuan > 0 && (
            <div className={`mt-2 flex items-center gap-2 ${budgetValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {budgetValidation.isValid ? (
                <>
                  <CheckCircle size={16} />
                  <span className="text-sm">{budgetValidation.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  <span className="text-sm">{budgetValidation.message}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              max={todayString}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Tanggal mulai tidak boleh melebihi hari ini.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={formData.start_date || undefined}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dokumen Wajib</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload 2 file wajib: file proposal dan file LPJ. Maksimal 1 MB per file.
            </p>
          </div>

          {REQUIRED_ATTACHMENTS.map((item) => {
            const existingAttachment = attachmentMap[item.key];
            const selectedFile = attachments[item.key];
            const fileError = fileErrors[item.key];

            return (
              <div key={item.key} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {item.label} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium uppercase">
                    1 MB Max
                  </span>
                </div>

                {existingAttachment && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 truncate">{existingAttachment.file_name}</p>
                      <p className="text-xs text-emerald-700">Lampiran aktif saat ini</p>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center transition-colors hover:border-blue-500 hover:bg-blue-50">
                  <label className="block cursor-pointer">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <div className="text-sm text-gray-600">
                      <span className="text-blue-600 hover:text-blue-500">Klik untuk upload</span>
                      <span> {existingAttachment ? 'file pengganti' : item.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, DOC, DOCX, XLS, XLSX
                    </p>
                    <input
                      type="file"
                      onChange={(event) => handleFileUpload(item.key, event)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                  </label>
                </div>

                {fileError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {fileError}
                  </div>
                )}

                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-blue-700">File ini akan menggantikan lampiran sebelumnya saat disimpan.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.key)}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                      title="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !budgetValidation.isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Perbarui Proposal' : 'Buat Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm;
