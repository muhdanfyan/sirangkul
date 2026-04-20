import React, { useEffect, useState } from 'react';
import { Upload, FileText, DollarSign, Save, Send, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, ProposalAttachmentUpload, RKAM } from '../services/api';
import Toast, { ToastType } from '../components/Toast';
import { formatAmountNumber, parseAmountValue } from '../utils/currency';
import { applyCompletedPaymentUsageToRKAM } from '../utils/rkamBudget';

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
    description: 'Upload dokumen proposal utama.',
  },
  {
    key: 'lpj',
    label: 'File LPJ',
    description: 'Upload dokumen LPJ pendukung.',
  },
];

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ProposalSubmission: React.FC = () => {
  const navigate = useNavigate();
  const todayString = getTodayDateString();

  const [formData, setFormData] = useState({
    rkam_id: '',
    title: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    category: '',
    urgency: 'Normal' as 'Rendah' | 'Normal' | 'Tinggi' | 'Mendesak',
  });
  const [attachments, setAttachments] = useState<Record<AttachmentType, File | null>>({
    proposal: null,
    lpj: null,
  });
  const [rkams, setRkams] = useState<RKAM[]>([]);
  const [selectedRkam, setSelectedRkam] = useState<RKAM | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<AttachmentType, string | null>>({
    proposal: null,
    lpj: null,
  });
  const [uploadStatus, setUploadStatus] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchRkams();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.rkam-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRkams = async () => {
    try {
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
        console.warn('Failed to sync completed payment usage for RKAM list:', paymentResult.reason);
      }

      const availableRkams = normalizedRkams.filter((rkam: RKAM) => {
        const sisa = parseAmountValue(rkam.sisa);
        return sisa > 0;
      });
      setRkams(availableRkams);
    } catch (err) {
      console.error('Error fetching RKAMs:', err);
      setToast({ message: 'Gagal memuat data RKAM', type: 'error' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRkamSelect = (rkamId: string) => {
    const rkam = rkams.find((item) => item.id === rkamId);
    setSelectedRkam(rkam || null);
    setFormData((prev) => ({
      ...prev,
      rkam_id: rkamId,
      category: rkam ? (rkam.bidang || rkam.kategori) : prev.category,
    }));
    setIsDropdownOpen(false);
    setSearchTerm('');
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

  const getAttachmentUploads = (): ProposalAttachmentUpload[] =>
    REQUIRED_ATTACHMENTS.map((item) => ({
      file: attachments[item.key] as File,
      attachmentType: item.key,
    }));

  const validateForm = () => {
    if (!formData.rkam_id) {
      return 'Silakan pilih RKAM terlebih dahulu';
    }

    if (!formData.title || !formData.description) {
      return 'Judul dan deskripsi wajib diisi';
    }

    if (!formData.budget) {
      return 'Anggaran wajib diisi';
    }

    if (!formData.startDate || !formData.endDate) {
      return 'Tanggal mulai dan tanggal selesai wajib diisi';
    }

    if (formData.startDate > todayString) {
      return 'Tanggal mulai proposal tidak boleh melebihi hari ini';
    }

    if (formData.endDate < formData.startDate) {
      return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai';
    }

    if (selectedRkam) {
      const budgetAmount = parseInt(formData.budget, 10);
      const sisaAmount = parseAmountValue(selectedRkam.sisa);

      if (budgetAmount > sisaAmount) {
        return `Anggaran melebihi sisa RKAM. Sisa saat ini Rp ${formatAmountNumber(sisaAmount)}`;
      }
    }

    for (const item of REQUIRED_ATTACHMENTS) {
      if (!attachments[item.key]) {
        return `${item.label} wajib diunggah`;
      }
    }

    return null;
  };

  const resetForm = () => {
    setFormData({
      rkam_id: '',
      title: '',
      description: '',
      budget: '',
      startDate: '',
      endDate: '',
      category: '',
      urgency: 'Normal',
    });
    setAttachments({
      proposal: null,
      lpj: null,
    });
    setSelectedRkam(null);
    setFileErrors({
      proposal: null,
      lpj: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setToast({ message: validationMessage, type: 'error' });
      return;
    }

    setLoading(true);
    setErrors({});
    setUploadStatus('');

    try {
      const proposalData = {
        rkam_id: formData.rkam_id,
        title: formData.title,
        description: formData.description || '',
        jumlah_pengajuan: parseInt(formData.budget, 10),
        urgency: formData.urgency,
        start_date: formData.startDate,
        end_date: formData.endDate,
      };

      setUploadStatus('Membuat proposal...');
      const createdProposal = await apiService.createProposal(proposalData);

      setUploadStatus('Mengompresi dan mengunggah file proposal + LPJ...');
      await apiService.uploadProposalAttachments(createdProposal.id, getAttachmentUploads());

      let successMessage = asDraft
        ? 'Proposal berhasil disimpan sebagai draft beserta file proposal dan LPJ.'
        : 'Proposal berhasil dibuat';

      if (!asDraft) {
        try {
          await apiService.submitProposal(createdProposal.id);
          successMessage = 'Proposal berhasil diajukan untuk verifikasi.';
        } catch (submitErr) {
          console.error('Error auto-submitting proposal:', submitErr);
          successMessage = 'Proposal berhasil dibuat, tetapi gagal diajukan otomatis. Silakan ajukan manual dari daftar proposal.';
        }
      }

      setToast({ message: successMessage, type: asDraft ? 'success' : 'info' });
      resetForm();

      setTimeout(() => {
        navigate('/proposal-tracking');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating proposal:', err);

      const errorResponse = err.response?.data;

      if (errorResponse?.errors) {
        const flattenedErrors: Record<string, string> = {};
        Object.entries(errorResponse.errors).forEach(([key, val]: [string, any]) => {
          flattenedErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setErrors(flattenedErrors);
        setToast({
          message: 'Terdapat kesalahan validasi. Silakan periksa form Anda.',
          type: 'error',
        });
      } else {
        const message = errorResponse?.message || err.message || 'Terjadi kesalahan saat pengiriman proposal';
        setErrors({ general: message });
        setToast({ message, type: 'error' });
      }
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Proposal Baru</h1>
        <p className="text-gray-600 mt-1">Lengkapi form di bawah untuk membuat proposal baru</p>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Terdapat kesalahan:</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>

              <div className="space-y-4">
                <div className="relative rkam-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih RKAM <span className="text-red-500">*</span>
                  </label>

                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-2.5 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                    } bg-white`}
                  >
                    <span className={`text-sm ${!selectedRkam ? 'text-gray-400' : 'text-gray-900'}`}>
                      {selectedRkam
                        ? `${selectedRkam.bidang || selectedRkam.kategori} - ${selectedRkam.item_name}`
                        : '-- Pilih RKAM --'}
                    </span>
                    <Search className={`h-4 w-4 transition-colors ${isDropdownOpen ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Cari kegiatan atau bidang..."
                            autoFocus
                            value={searchTerm}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto">
                        {rkams.filter((rkam) =>
                          !searchTerm
                          || (rkam.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                          || (rkam.bidang || rkam.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()),
                        ).length > 0 ? (
                          rkams
                            .filter((rkam) =>
                              !searchTerm
                              || (rkam.item_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                              || (rkam.bidang || rkam.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()),
                            )
                            .map((rkam) => {
                              const sisaAmount = rkam.sisa !== undefined && rkam.sisa !== null ? String(rkam.sisa) : '0';
                              const isSelected = formData.rkam_id === rkam.id;

                              return (
                                <div
                                  key={rkam.id}
                                  onClick={() => handleRkamSelect(rkam.id)}
                                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                                        {rkam.bidang || rkam.kategori}
                                      </p>
                                      <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {rkam.item_name}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Sisa Pagu</p>
                                      <p className="text-xs font-bold text-green-600">
                                        Rp {formatAmountNumber(sisaAmount)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="p-8 text-center">
                            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Tidak ada kegiatan yang cocok</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedRkam && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Informasi RKAM Terpilih</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600">Pagu</p>
                          <p className="font-semibold text-blue-900">
                          Rp {formatAmountNumber(selectedRkam.pagu)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Terpakai</p>
                        <p className="font-semibold text-blue-900">
                          Rp {formatAmountNumber(selectedRkam.terpakai)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Sisa</p>
                        <p className="font-semibold text-green-700">
                          Rp {formatAmountNumber(selectedRkam.sisa)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Proposal *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan judul proposal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jelaskan detail proposal Anda"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tingkat Urgensi
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Rendah">Rendah</option>
                      <option value="Normal">Normal</option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Mendesak">Mendesak</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Anggaran & Waktu</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anggaran yang Dibutuhkan *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget ? `Rp ${formatAmountNumber(formData.budget)}` : ''}
                      onChange={(event) => {
                        const value = event.target.value.replace(/[^\d]/g, '');
                        setFormData((prev) => ({ ...prev, budget: value }));
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                  {selectedRkam && formData.budget && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const budgetAmount = parseInt(formData.budget, 10);
                        const sisaAmount = parseAmountValue(selectedRkam.sisa);

                        return budgetAmount <= sisaAmount ? (
                          <span className="text-green-600">Anggaran sesuai dengan sisa RKAM</span>
                        ) : (
                          <span className="text-red-600">Anggaran melebihi sisa RKAM (Sisa: Rp {formatAmountNumber(sisaAmount)})</span>
                        );
                      })()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      max={todayString}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Tanggal mulai tidak boleh melebihi hari ini.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Dokumen Wajib</h3>
              <p className="text-xs text-gray-500 mb-4">
                Wajib upload 2 file: proposal dan LPJ. Maksimal 1 MB per file. Format: PDF, DOC, DOCX, XLS, XLSX.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {REQUIRED_ATTACHMENTS.map((item) => {
                  const selectedFile = attachments[item.key];
                  const fileError = fileErrors[item.key];

                  return (
                    <div key={item.key} className="border border-gray-200 rounded-lg p-4 h-full">
                      <div className="flex items-start justify-between gap-4 mb-3">
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

                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center transition-colors hover:border-blue-500 hover:bg-blue-50">
                        <label className="block cursor-pointer">
                          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                          <div className="text-sm text-gray-600">
                            <span className="text-blue-600 hover:text-blue-500">Klik untuk upload</span>
                            <span> {item.label}</span>
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
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                          {fileError}
                        </div>
                      )}

                      {selectedFile && (
                        <div className="mt-3 flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              {uploadStatus && (
                <div className="flex items-center text-sm text-blue-600 mr-auto">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8H4z" />
                  </svg>
                  {uploadStatus}
                </div>
              )}
              <button
                type="button"
                onClick={(event) => handleSubmit(event, true)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan Draft'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Mengirim...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Panduan Pengisian</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pilih RKAM yang sesuai dengan kebutuhan proposal.</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Upload 2 file wajib: file proposal dan file LPJ.</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Ukuran setiap file maksimal 1 MB.</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Tanggal mulai tidak boleh melebihi hari ini.</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pastikan anggaran tidak melebihi sisa RKAM.</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Alur Persetujuan</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>1. Verifikator</div>
              <div>2. Komite Madrasah</div>
              <div>3. Kepala Madrasah</div>
              <div>4. Bendahara</div>
            </div>
            <div className="mt-4 text-xs text-blue-700">
              Proposal akan melalui 4 tahap persetujuan sebelum dapat direalisasi.
            </div>
          </div>
        </div>
      </div>

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

export default ProposalSubmission;
