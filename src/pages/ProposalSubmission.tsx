import React, { useState, useEffect } from 'react';
import { Upload, FileText, DollarSign, Save, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, RKAM } from '../services/api';
import Toast, { ToastType } from '../components/Toast';

const MAX_FILES = 5;
const MIN_FILES = 1;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const ProposalSubmission: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    rkam_id: '',
    title: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    category: '',
    urgency: 'Normal'
  });

  const [files, setFiles] = useState<File[]>([]);
  const [rkams, setRkams] = useState<RKAM[]>([]);
  const [selectedRkam, setSelectedRkam] = useState<RKAM | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchRkams();
  }, []);

  const fetchRkams = async () => {
    try {
      const data = await apiService.getAllRKAM();
      // Only show RKAM items that have budget remaining
      const availableRkams = data.filter(rkam => {
        const sisa = typeof rkam.sisa === 'string' ? parseFloat(rkam.sisa) : rkam.sisa;
        return sisa > 0;
      });
      setRkams(availableRkams);
    } catch (err) {
      console.error('Error fetching RKAMs:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRkamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rkamId = e.target.value;
    const rkam = rkams.find(r => r.id === rkamId);
    setSelectedRkam(rkam || null);
    setFormData({
      ...formData,
      rkam_id: rkamId
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const newErrors: string[] = [];

    const combined = [...files, ...selected];

    if (combined.length > MAX_FILES) {
      newErrors.push(`Maksimal ${MAX_FILES} dokumen. Anda memilih ${combined.length}.`);
    }

    selected.forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        newErrors.push(`"${file.name}" — tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX.`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        newErrors.push(`"${file.name}" — ukuran file (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas 5 MB.`);
      }
    });

    setFileErrors(newErrors);
    if (newErrors.length === 0) {
      setFiles(combined.slice(0, MAX_FILES));
    }
    // reset input so same files can be re-selected after removal
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    
    // Validation
    if (!formData.rkam_id) {
      setToast({ message: 'Silahkan pilih RKAM terlebih dahulu', type: 'error' });
      return;
    }

    if (!formData.title || !formData.description) {
      setToast({ message: 'Judul dan deskripsi wajib diisi', type: 'error' });
      return;
    }

    if (!formData.budget) {
      setToast({ message: 'Anggaran wajib diisi', type: 'error' });
      return;
    }

    // Budget validation against RKAM sisa
    if (selectedRkam) {
      const budgetAmount = parseInt(formData.budget);
      const sisaAmount = typeof selectedRkam.sisa === 'string' 
        ? parseFloat(selectedRkam.sisa) 
        : selectedRkam.sisa;
      
      if (budgetAmount > sisaAmount) {
        setToast({ 
          message: `Anggaran melebihi sisa RKAM\nSisa: Rp ${formatRupiah(String(sisaAmount))}`, 
          type: 'error' 
        });
        return;
      }
    }

    // File validation
    if (files.length < MIN_FILES) {
      setToast({ message: `Minimal ${MIN_FILES} dokumen pendukung wajib dilampirkan.`, type: 'error' });
      return;
    }

    setLoading(true);
    setErrors({});
    setUploadStatus('');

    try {
      const proposalData = {
        rkam_id: formData.rkam_id,
        title: formData.title,
        description: formData.description,
        jumlah_pengajuan: parseInt(formData.budget)
      };

      setUploadStatus('Membuat proposal...');
      const createdProposal = await apiService.createProposal(proposalData);

      // Upload attachments
      setUploadStatus(`Mengompresi & mengunggah ${files.length} dokumen...`);
      await apiService.uploadProposalAttachments(createdProposal.id, files);

      if (asDraft) {
        setToast({ message: 'Proposal berhasil disimpan sebagai draft beserta dokumen pendukung.', type: 'success' });
      } else {
        setToast({
          message: `Proposal berhasil dibuat!\nID: ${createdProposal.id}`,
          type: 'success'
        });
      }

      // Reset form
      setFormData({
        rkam_id: '',
        title: '',
        description: '',
        budget: '',
        startDate: '',
        endDate: '',
        category: '',
        urgency: 'Normal'
      });
      setSelectedRkam(null);
      setFiles([]);

      // Redirect to proposal list after 1.5 seconds
      setTimeout(() => {
        navigate('/proposal-tracking');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating proposal:', err);
      
      // Handle validation errors from backend
      const error = err as { response?: { data?: { errors?: Record<string, string> } } } & Error;
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setToast({ 
          message: 'Terdapat kesalahan validasi. Silahkan periksa form Anda.', 
          type: 'error' 
        });
      } else if (error instanceof Error) {
        setErrors({ general: error.message });
        setToast({ message: `Gagal membuat proposal: ${error.message}`, type: 'error' });
      } else {
        setErrors({ general: 'Terjadi kesalahan yang tidak diketahui' });
        setToast({ message: 'Gagal membuat proposal. Silahkan coba lagi.', type: 'error' });
      }
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  const formatRupiah = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Proposal Baru</h1>
        <p className="text-gray-600 mt-1">Lengkapi form di bawah untuk membuat proposal baru</p>
      </div>

      {/* Error Display */}
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
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
              
              <div className="space-y-4">
                {/* RKAM Selection - NEW */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih RKAM <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="rkam_id"
                    value={formData.rkam_id}
                    onChange={handleRkamChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">-- Pilih RKAM --</option>
                    {rkams.map((rkam) => {
                      const sisaAmount = typeof rkam.sisa === 'string' ? rkam.sisa : String(rkam.sisa);
                      return (
                        <option key={rkam.id} value={rkam.id}>
                          {rkam.kategori} - {rkam.item_name} (Sisa: Rp {formatRupiah(sisaAmount)})
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Pilih item RKAM yang akan digunakan untuk proposal ini
                  </p>
                </div>

                {/* RKAM Info Display - NEW */}
                {selectedRkam && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Informasi RKAM Terpilih</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600">Pagu</p>
                        <p className="font-semibold text-blue-900">
                          Rp {formatRupiah(typeof selectedRkam.pagu === 'string' ? selectedRkam.pagu : String(selectedRkam.pagu))}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Terpakai</p>
                        <p className="font-semibold text-blue-900">
                          Rp {formatRupiah(typeof selectedRkam.terpakai === 'string' ? selectedRkam.terpakai : String(selectedRkam.terpakai))}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">Sisa</p>
                        <p className="font-semibold text-green-700">
                          Rp {formatRupiah(typeof selectedRkam.sisa === 'string' ? selectedRkam.sisa : String(selectedRkam.sisa))}
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
                      Kategori *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Kurikulum">Kurikulum</option>
                      <option value="Kantor">Kantor</option>
                      <option value="Sarana Prasarana">Sarana Prasarana</option>
                      <option value="Humas">Humas</option>
                      <option value="Kesiswaan">Kesiswaan</option>
                      <option value="Komite">Komite</option>
                    </select>
                  </div>

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

            {/* Budget and Timeline */}
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
                      value={formData.budget ? `Rp ${formatRupiah(formData.budget)}` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFormData({ ...formData, budget: value });
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rp 0"
                      required
                    />
                  </div>
                  {selectedRkam && formData.budget && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const budgetAmount = parseInt(formData.budget);
                        const sisaAmount = typeof selectedRkam.sisa === 'string' 
                          ? parseFloat(selectedRkam.sisa) 
                          : selectedRkam.sisa;
                        return budgetAmount <= sisaAmount ? (
                          <span className="text-green-600">✓ Anggaran sesuai dengan sisa RKAM</span>
                        ) : (
                          <span className="text-red-600">✗ Anggaran melebihi sisa RKAM (Sisa: Rp {formatRupiah(String(sisaAmount))})</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Dokumen Pendukung</h3>
              <p className="text-xs text-gray-500 mb-4">
                Wajib: {MIN_FILES}–{MAX_FILES} file &bull; Maks. 5 MB per file &bull; Format: PDF, DOC, DOCX, XLS, XLSX &bull;
                File akan dikompresi otomatis sebelum diunggah
              </p>
              
              <div className="space-y-4">
                {/* File error messages */}
                {fileErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {fileErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Dokumen (RAB, TOR, dll.)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center transition-colors hover:border-blue-500 hover:bg-blue-50">
                    <label className={`block cursor-pointer ${files.length >= MAX_FILES ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-sm text-gray-600">
                        <span className="text-blue-600 hover:text-blue-500">Klik untuk upload</span>
                        <span> atau drag and drop file di sini</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX, XLS, XLSX &bull; Maks. 5 MB per file &bull; {files.length}/{MAX_FILES} file dipilih
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        disabled={files.length >= MAX_FILES}
                      />
                    </label>
                  </div>
                  
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                          <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 mr-3">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0"
                            title="Hapus file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              {uploadStatus && (
                <div className="flex items-center text-sm text-blue-600 mr-auto">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {uploadStatus}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guidelines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Panduan Pengisian</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pilih RKAM yang sesuai dengan kebutuhan proposal</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pastikan judul proposal jelas dan spesifik</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Sertakan deskripsi lengkap dengan tujuan dan manfaat</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Upload dokumen pendukung seperti RAB dan TOR</div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>Pastikan anggaran tidak melebihi sisa RKAM</div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Alur Persetujuan</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>1. Verifikator</div>
              <div>2. Kepala Madrasah</div>
              <div>3. Komite Madrasah</div>
              <div>4. Bendahara</div>
            </div>
            <div className="mt-4 text-xs text-blue-700">
              Proposal akan melalui 4 tahap persetujuan sebelum dapat direalisasi.
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
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