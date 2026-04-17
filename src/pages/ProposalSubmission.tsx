import React, { useState, useEffect } from 'react';
import { Upload, FileText, DollarSign, Save, Send, Search, X } from 'lucide-react';
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
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedRkam, setSelectedRkam] = useState<RKAM | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchRkams();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const options = await apiService.getRKAMOptions();
      if (options.success && options.data?.categories) {
        setCategories(options.data.categories);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const fetchRkams = async () => {
    try {
      const response = await apiService.getAllRKAM({ no_paginate: true });
      // Extract array from the result
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      // Only show RKAM items that have budget remaining
      const availableRkams = data.filter((rkam: RKAM) => {
        const sisa = typeof rkam.sisa === 'string' ? parseFloat(rkam.sisa) : (rkam.sisa || 0);
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

  const handleRkamSelect = (rkamId: string) => {
    const rkam = rkams.find(r => r.id === rkamId);
    setSelectedRkam(rkam || null);
    
    // Automatically set the category if an RKAM is selected
    setFormData({
      ...formData,
      rkam_id: rkamId,
      category: rkam ? rkam.kategori : formData.category
    });
    
    setIsDropdownOpen(false);
    setSearchTerm(''); // Reset search on select
  };

  // Close dropdown when clicking outside
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
        description: formData.description || '',
        jumlah_pengajuan: parseInt(formData.budget),
        urgency: formData.urgency,
        start_date: formData.startDate,
        end_date: formData.endDate
      };

      setUploadStatus('Membuat proposal...');
      const createdProposal = await apiService.createProposal(proposalData);
      // Upload attachments
      if (files.length > 0) {
        setUploadStatus(`Mengompresi & mengunggah ${files.length} dokumen...`);
        await apiService.uploadProposalAttachments(createdProposal.id, files);
      }
      
      let successMessage = asDraft 
        ? 'Proposal berhasil disimpan sebagai draft beserta dokumen pendukung.' 
        : 'Proposal berhasil dibuat';

      // Automatically submit if not saving as draft
      if (!asDraft) {
        try {
          await apiService.submitProposal(createdProposal.id);
          successMessage = 'Proposal berhasil diajukan untuk verifikasi!';
        } catch (submitErr) {
          console.error('Error auto-submitting proposal:', submitErr);
          successMessage = 'Proposal berhasil dibuat, namun gagal diajukan otomatis. Silahkan ajukan manual dari daftar proposal.';
        }
      }

      setToast({ message: successMessage, type: asDraft ? 'success' : 'info' });

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
      
    } catch (err: any) {
      console.error('Error creating proposal:', err);
      
      const errorResponse = err.response?.data;
      
      if (errorResponse?.errors) {
        // Flatten validation errors that might be arrays
        const flattenedErrors: Record<string, string> = {};
        Object.entries(errorResponse.errors).forEach(([key, val]: [string, any]) => {
          flattenedErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setErrors(flattenedErrors);
        setToast({ 
          message: 'Terdapat kesalahan validasi. Silahkan periksa form Anda.', 
          type: 'error' 
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

  const formatRupiah = (value: string | number) => {
    const stringValue = typeof value === 'number' ? String(value) : (value || '0');
    const number = stringValue.replace(/[^\d]/g, '');
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
                {/* RKAM Selection - Custom Searchable Dropdown */}
                <div className="relative rkam-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih RKAM <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Pseudo-Select Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-2.5 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                    } bg-white`}
                  >
                    <span className={`text-sm ${!selectedRkam ? 'text-gray-400' : 'text-gray-900'}`}>
                      {selectedRkam 
                        ? `${selectedRkam.kategori} - ${selectedRkam.item_name}` 
                        : '-- Pilih RKAM --'}
                    </span>
                    <Search className={`h-4 w-4 transition-colors ${isDropdownOpen ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {/* Internal Search Box */}
                      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Cari kegiatan atau kategori..."
                            autoFocus
                            value={searchTerm}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="max-h-[300px] overflow-y-auto">
                        {rkams.filter(rkam => 
                          !searchTerm || 
                          (rkam.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (rkam.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
                        ).length > 0 ? (
                          rkams
                            .filter(rkam => 
                              !searchTerm || 
                              (rkam.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (rkam.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                                        {rkam.kategori}
                                      </p>
                                      <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {rkam.item_name}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Sisa Pagu</p>
                                      <p className="text-xs font-bold text-green-600">
                                        Rp {formatRupiah(sisaAmount)}
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