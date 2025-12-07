import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { apiService, RKAM, ProposalCreateRequest } from '../../services/api';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ProposalFormProps {
  isEdit?: boolean;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [rkams, setRkams] = useState<RKAM[]>([]);
  const [selectedRkam, setSelectedRkam] = useState<RKAM | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRkams, setLoadingRkams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const toast = useToast();
  const location = useLocation();

  const [formData, setFormData] = useState<ProposalCreateRequest>({
    rkam_id: '',
    title: '',
    description: '',
    jumlah_pengajuan: 0,
  });

  useEffect(() => {
    fetchRkams();
      if (isEdit && id) {
      fetchProposal(id);
    }
  }, [isEdit, id]);

  // If we've been navigated here with a toast payload, show it once and clear history state
  useEffect(() => {
    const state = (location.state as { toast?: { message: string; type?: 'success' | 'error' | 'info' | 'warning' } } | undefined) || undefined;
    if (state?.toast) {
      const t = state.toast as { message: string; type?: 'success' | 'error' | 'info' | 'warning' };
      toast(t.message, t.type ?? 'info');
      // clear navigation state so the toast doesn't replay if user refreshes
      try {
        navigate(location.pathname, { replace: true, state: undefined });
      } catch {
        // ignore
      }
    }
  // only run on mount or when location.pathname changes
  }, [location.pathname, navigate, toast]);

  const fetchRkams = async () => {
    try {
      setLoadingRkams(true);
      const data = await apiService.getAllRKAM();
      // Only show RKAM items that have budget remaining
      const availableRkams = data.filter(rkam => {
        const sisa = typeof rkam.sisa === 'string' ? parseFloat(rkam.sisa) : rkam.sisa;
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
      });
      
      // Set selected RKAM
      if (proposal.rkam) {
        setSelectedRkam(proposal.rkam);
      }
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Gagal memuat data proposal');
    }
    finally {
      setLoadingRkams(false);
    }
  };

  const handleRkamChange = (rkamId: string) => {
    const rkam = rkams.find(r => r.id === rkamId);
    setSelectedRkam(rkam || null);
    setFormData({ ...formData, rkam_id: rkamId });
  };

  const validateBudget = (): { isValid: boolean; message: string } => {
    if (!selectedRkam) return { isValid: false, message: '' };
    
    const sisa = typeof selectedRkam.sisa === 'string' 
      ? parseFloat(selectedRkam.sisa) 
      : selectedRkam.sisa;
    
    const requested = formData.jumlah_pengajuan;
    
    if (requested <= 0) {
      return { isValid: false, message: 'Jumlah pengajuan harus lebih dari 0' };
    }
    
    if (requested > sisa) {
      return { 
        isValid: false, 
        message: `Jumlah pengajuan melebihi sisa anggaran RKAM (${formatRupiah(sisa)})` 
      };
    }
    
    return { isValid: true, message: 'Jumlah pengajuan valid' };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate budget
    const budgetValidation = validateBudget();
    if (!budgetValidation.isValid) {
      setError(budgetValidation.message);
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      if (isEdit && id) {
        await apiService.updateProposal(id, formData);
        toast('Proposal berhasil diperbarui', 'success');
        navigate('/proposal-tracking', { state: { toast: { message: 'Proposal berhasil diperbarui', type: 'success' } } });
      } else {
        await apiService.createProposal(formData);
        toast('Proposal berhasil dibuat', 'success');
        navigate('/proposal-tracking', { state: { toast: { message: 'Proposal berhasil dibuat', type: 'success' } } });
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        // Backend validation errors
        setValidationErrors(err.errors as Record<string, string[]>);
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
      {/* Header */}
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
            {isEdit ? 'Perbarui informasi proposal' : 'Buat pengajuan proposal anggaran baru'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-600 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* RKAM Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih RKAM <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.rkam_id}
            onChange={(e) => handleRkamChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isEdit} // Disable RKAM change when editing
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

        {/* RKAM Info Card */}
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

        {/* Title */}
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Masukkan deskripsi proposal (opsional)"
            rows={4}
          />
          {validationErrors.description && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.description[0]}</p>
          )}
        </div>

        {/* Jumlah Pengajuan */}
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
          
          {/* Budget Validation Feedback */}
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

        {/* Action Buttons */}
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
      {/* toasts are displayed by the global ToastProvider */}
    </div>
  );
};

export default ProposalForm;
