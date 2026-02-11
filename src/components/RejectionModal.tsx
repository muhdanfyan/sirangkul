import React, { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, improvements: string) => void;
  proposalTitle: string;
  isLoading?: boolean;
  userRole: 'verifikator' | 'kepala_madrasah' | 'komite_madrasah' | 'bendahara';
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  proposalTitle,
  isLoading = false,
  userRole
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [errors, setErrors] = useState<{reason?: string, improvements?: string}>({});

  const validateForm = () => {
    const newErrors: {reason?: string, improvements?: string} = {};
    
    if (!rejectionReason.trim()) {
      newErrors.reason = 'Alasan penolakan wajib diisi';
    } else if (rejectionReason.trim().length < 10) {
      newErrors.reason = 'Alasan penolakan minimal 10 karakter';
    }

    if (!improvementSuggestions.trim()) {
      newErrors.improvements = 'Saran perbaikan wajib diisi';
    } else if (improvementSuggestions.trim().length < 20) {
      newErrors.improvements = 'Saran perbaikan minimal 20 karakter untuk membantu pengusul';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm(rejectionReason.trim(), improvementSuggestions.trim());
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    setImprovementSuggestions('');
    setErrors({});
    onClose();
  };

  const getRoleLabel = () => {
    const roleLabels = {
      'verifikator': 'Verifikator',
      'kepala_madrasah': 'Kepala Madrasah',
      'komite_madrasah': 'Komite Madrasah',
      'bendahara': 'Bendahara'
    };
    return roleLabels[userRole];
  };

  const getPlaceholderReason = () => {
    const placeholders = {
      'verifikator': 'Contoh: Dokumen pendukung tidak lengkap, data anggaran tidak sesuai format, dll.',
      'kepala_madrasah': 'Contoh: Proposal tidak sesuai dengan prioritas madrasah, anggaran melebihi alokasi, dll.',
      'komite_madrasah': 'Contoh: Perlu konsultasi lebih lanjut dengan stakeholder, nilai terlalu besar untuk periode ini, dll.',
      'bendahara': 'Contoh: Data rekening penerima tidak valid, dokumen kelengkapan pembayaran kurang, dll.'
    };
    return placeholders[userRole];
  };

  const getPlaceholderImprovements = () => {
    const placeholders = {
      'verifikator': 'Contoh: Harap lampirkan RAB detail, perjelas tujuan kegiatan, sesuaikan format proposal dengan template, dll.',
      'kepala_madrasah': 'Contoh: Harap sesuaikan dengan skala prioritas madrasah, kurangi jumlah anggaran atau pecah menjadi beberapa tahap, dll.',
      'komite_madrasah': 'Contoh: Harap ajukan kembali semester depan dengan pertimbangan X, sertakan analisis dampak yang lebih detail, dll.',
      'bendahara': 'Contoh: Harap perbaiki data rekening penerima, lengkapi dokumen pendukung pembayaran, dll.'
    };
    return placeholders[userRole];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Penolakan Proposal
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Sebagai {getRoleLabel()}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Info Proposal */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-semibold text-red-800">
                  Anda akan menolak proposal berikut:
                </h4>
                <p className="text-sm text-red-700 mt-1 font-medium">
                  "{proposalTitle}"
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Pastikan Anda memberikan alasan yang jelas dan saran perbaikan yang konstruktif untuk membantu pengusul memperbaiki proposalnya.
                </p>
              </div>
            </div>
          </div>

          {/* Alasan Penolakan */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Jelaskan mengapa proposal ini ditolak. Minimal 10 karakter.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={isLoading}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={getPlaceholderReason()}
            />
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.reason}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Karakter: {rejectionReason.length}
              </span>
              <span className={rejectionReason.length >= 10 ? 'text-green-600' : 'text-gray-400'}>
                Minimal: 10 karakter
              </span>
            </div>
          </div>

          {/* Saran Perbaikan */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Saran Perbaikan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Berikan panduan yang jelas agar pengusul dapat memperbaiki dan mengajukan kembali proposal. Minimal 20 karakter.
            </p>
            <textarea
              value={improvementSuggestions}
              onChange={(e) => setImprovementSuggestions(e.target.value)}
              disabled={isLoading}
              rows={5}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.improvements ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={getPlaceholderImprovements()}
            />
            {errors.improvements && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.improvements}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Karakter: {improvementSuggestions.length}
              </span>
              <span className={improvementSuggestions.length >= 20 ? 'text-green-600' : 'text-gray-400'}>
                Minimal: 20 karakter
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips Memberikan Feedback yang Baik:
            </h5>
            <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
              <li>Berikan alasan yang spesifik dan objektif</li>
              <li>Hindari kata-kata yang bersifat menyerang pribadi</li>
              <li>Sertakan referensi kebijakan atau panduan yang relevan</li>
              <li>Berikan langkah-langkah konkret untuk perbaikan</li>
              <li>Gunakan bahasa yang profesional dan konstruktif</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak Proposal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
