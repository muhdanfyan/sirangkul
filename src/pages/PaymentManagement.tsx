import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Receipt, CheckCircle, Clock, Search, AlertCircle, XCircle, FileText } from 'lucide-react';
import { apiService, Payment, Proposal, PaymentProcessRequest, PaymentCompleteRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Toast, { ToastType } from '../components/Toast';
import InfoModal from '../components/InfoModal';
import CancelModal from '../components/CancelModal';

const PaymentManagement: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'processing' | 'completed' | 'failed'>('All');
  
  // Modal states
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Form states
  const [processForm, setProcessForm] = useState<PaymentProcessRequest>({
    recipient_name: '',
    recipient_account: '',
    bank_name: '',
    payment_method: 'transfer',
    payment_reference: '',
    notes: ''
  });
  
  const [completeForm, setCompleteForm] = useState<PaymentCompleteRequest>({
    payment_proof_url: '',
    admin_notes: ''
  });

  // File upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Toast & Modal states
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    payment: Payment | null;
  }>({
    isOpen: false,
    payment: null
  });
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pending, allPayments] = await Promise.all([
        apiService.getPendingPayments(),
        apiService.getAllPayments()
      ]);
      
      setPendingProposals(pending);
      setPayments(allPayments);
      
      console.log('✅ Payment data loaded:', { 
        pendingProposals: pending,
        pendingCount: pending.length, 
        payments: allPayments,
        paymentsCount: allPayments.length,
        user: user?.role 
      });
    } catch (err: unknown) {
      console.error('❌ Error fetching payment data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    try {
      setActionLoading(true);
      const response = await apiService.processPayment(selectedProposal.id, processForm);
      
      setToast({
        message: `Pembayaran berhasil diproses!\nPayment ID: ${response.data.payment_id}\nStatus: ${response.data.status}`,
        type: 'success'
      });
      
      setProcessForm({
        recipient_name: '',
        recipient_account: '',
        bank_name: '',
        payment_method: 'transfer',
        payment_reference: '',
        notes: ''
      });
      setShowProcessModal(false);
      setSelectedProposal(null);
      await fetchData();
    } catch (err: unknown) {
      setToast({
        message: `Gagal memproses pembayaran: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`,
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    // Validation: Must have either file or URL
    if (!proofFile && !completeForm.payment_proof_url) {
      setToast({
        message: 'Bukti pembayaran wajib diupload atau URL harus diisi!',
        type: 'error'
      });
      return;
    }

    try {
      setActionLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      
      if (proofFile) {
        formData.append('payment_proof_file', proofFile);
      }
      
      if (completeForm.payment_proof_url) {
        formData.append('payment_proof_url', completeForm.payment_proof_url);
      }
      
      if (completeForm.admin_notes) {
        formData.append('admin_notes', completeForm.admin_notes);
      }

      const response = await apiService.completePaymentWithFile(selectedPayment.id, formData);
      const { rkam_update } = response.data;
      
      setInfoModal({
        isOpen: true,
        title: 'Pembayaran Berhasil Diselesaikan!',
        message: 
          `RKAM telah diperbarui:\n\n` +
          `Terpakai Sebelum: Rp ${rkam_update.old_terpakai.toLocaleString('id-ID')}\n` +
          `Terpakai Sekarang: Rp ${rkam_update.new_terpakai.toLocaleString('id-ID')}\n` +
          `Sisa Budget: Rp ${rkam_update.new_sisa.toLocaleString('id-ID')}`,
        type: 'success'
      });
      
      // Reset form and file
      setCompleteForm({ payment_proof_url: '', admin_notes: '' });
      setProofFile(null);
      setProofPreview(null);
      setShowCompleteModal(false);
      setSelectedPayment(null);
      await fetchData();
    } catch (err: unknown) {
      setToast({
        message: `Gagal menyelesaikan pembayaran: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`,
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPayment = async (reason: string) => {
    if (!cancelModal.payment) return;

    try {
      setActionLoading(true);
      const response = await apiService.cancelPayment(cancelModal.payment.id, reason);
      
      setToast({
        message: `Pembayaran berhasil dibatalkan!\nProposal kembali ke status: ${response.data.proposal_status}`,
        type: 'success'
      });
      
      setCancelModal({ isOpen: false, payment: null });
      await fetchData();
    } catch (err: unknown) {
      setToast({
        message: `Gagal membatalkan pembayaran: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`,
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelConfirm = (payment: Payment) => {
    setCancelModal({
      isOpen: true,
      payment: payment
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setToast({
        message: 'Ukuran file terlalu besar! Maksimal 10MB.',
        type: 'error'
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setToast({
        message: 'Format file tidak didukung! Gunakan JPG, PNG, atau PDF.',
        type: 'error'
      });
      return;
    }

    setProofFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'transfer': return 'Transfer Bank';
      case 'cash': return 'Tunai';
      case 'check': return 'Cek';
      default: return method;
    }
  };

  // Calculate stats
  const stats = {
    totalPayments: payments.length,
    pendingCount: payments.filter(p => p.status === 'pending').length + pendingProposals.length,
    processingCount: payments.filter(p => p.status === 'processing').length,
    completedCount: payments.filter(p => p.status === 'completed').length,
    totalAmount: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0)
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.proposal?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter pending proposals
  const filteredPendingProposals = pendingProposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error: {error}</span>
        </div>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pembayaran</h1>
        <p className="text-gray-600 mt-1">Kelola pembayaran proposal yang telah disetujui</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Pembayaran</p>
              <p className="text-3xl font-bold mt-2">{stats.totalPayments}</p>
            </div>
            <CreditCard className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Menunggu Proses</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingCount}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Sedang Diproses</p>
              <p className="text-3xl font-bold mt-2">{stats.processingCount}</p>
            </div>
            <Receipt className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Terbayar</p>
              <p className="text-2xl font-bold mt-2">{formatRupiah(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari proposal, penerima, atau referensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'pending' | 'processing' | 'completed' | 'failed')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Pending Proposals Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Proposal Perlu Dibayar</h2>
          <p className="text-sm text-gray-600">Proposal yang telah disetujui dan menunggu proses pembayaran</p>
        </div>
        
        {filteredPendingProposals.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Tidak ada proposal yang perlu dibayar</p>
            <p className="text-sm mt-1">Proposal yang telah disetujui Kepala Madrasah akan muncul di sini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengusul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Disetujui</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPendingProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                      <div className="text-sm text-gray-500">ID: {proposal.id.substring(0, 8)}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{proposal.user?.full_name || proposal.user?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatRupiah(proposal.jumlah_pengajuan)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {proposal.final_approved_at ? formatDate(proposal.final_approved_at) : 
                         proposal.approved_at ? formatDate(proposal.approved_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setProcessForm(prev => ({
                            ...prev,
                            recipient_name: proposal.user?.full_name || proposal.user?.name || ''
                          }));
                          setShowProcessModal(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Proses Pembayaran
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Pembayaran</h2>
          <p className="text-sm text-gray-600">Daftar semua pembayaran yang telah diproses</p>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Tidak ada pembayaran yang sesuai dengan pencarian</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penerima</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.proposal?.title || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.payment_reference || `ID: ${payment.id.substring(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.recipient_name}</div>
                      <div className="text-sm text-gray-500">{payment.recipient_account}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatRupiah(payment.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getPaymentMethodLabel(payment.payment_method)}</div>
                      {payment.bank_name && (
                        <div className="text-sm text-gray-500">{payment.bank_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {payment.processed_at ? formatDate(payment.processed_at) : formatDate(payment.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Lihat Detail"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                        {payment.status === 'processing' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowCompleteModal(true);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Selesaikan
                          </button>
                        )}
                        {(payment.status === 'pending' || payment.status === 'processing') && (
                          <button
                            onClick={() => openCancelConfirm(payment)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Payment Modal */}
      {showProcessModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Proses Pembayaran</h3>
              <p className="text-sm text-gray-600 mt-1">Isi informasi penerima dan metode pembayaran</p>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Informasi Proposal</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Judul:</span> <span className="font-medium">{selectedProposal.title}</span></p>
                  <p><span className="text-gray-600">Pengusul:</span> <span className="font-medium">{selectedProposal.user?.full_name || selectedProposal.user?.name}</span></p>
                  <p><span className="text-gray-600">Jumlah:</span> <span className="font-medium text-green-600">{formatRupiah(selectedProposal.jumlah_pengajuan)}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima *</label>
                <input
                  type="text"
                  required
                  value={processForm.recipient_name}
                  onChange={(e) => setProcessForm({ ...processForm, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  value={processForm.recipient_account}
                  onChange={(e) => setProcessForm({ ...processForm, recipient_account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={processForm.bank_name}
                  onChange={(e) => setProcessForm({ ...processForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>
                <select
                  required
                  value={processForm.payment_method}
                  onChange={(e) => setProcessForm({ ...processForm, payment_method: e.target.value as 'transfer' | 'cash' | 'check' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="check">Cek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referensi Pembayaran</label>
                <input
                  type="text"
                  value={processForm.payment_reference}
                  onChange={(e) => setProcessForm({ ...processForm, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={processForm.notes}
                  onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedProposal(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Memproses...' : 'Proses Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Payment Modal */}
      {showCompleteModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Selesaikan Pembayaran</h3>
            </div>

            <form onSubmit={handleCompletePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Informasi Pembayaran</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Proposal:</span> <span className="font-medium">{selectedPayment.proposal?.title}</span></p>
                  <p><span className="text-gray-600">Penerima:</span> <span className="font-medium">{selectedPayment.recipient_name}</span></p>
                  <p><span className="text-gray-600">Jumlah:</span> <span className="font-medium text-green-600">{formatRupiah(selectedPayment.amount)}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Pembayaran * <span className="text-red-500">(Wajib)</span>
                </label>
                
                {/* Option 1: Upload File */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors mb-3">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Klik untuk upload atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF (maksimal 10MB)
                    </p>
                  </label>
                </div>

                {/* Preview uploaded file */}
                {proofFile && (
                  <div className="mt-2 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">{proofFile.name}</p>
                      <p className="text-xs text-green-700">{(proofFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeProofFile}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Preview image */}
                {proofPreview && (
                  <div className="mt-2">
                    <img 
                      src={proofPreview} 
                      alt="Preview" 
                      className="max-w-full h-40 object-contain rounded border border-gray-200"
                    />
                  </div>
                )}

                {/* Option 2: Or paste URL */}
                <div className="mt-4">
                  <label className="block text-xs text-gray-600 mb-1">
                    Atau paste URL bukti pembayaran:
                  </label>
                  <input
                    type="url"
                    value={completeForm.payment_proof_url}
                    onChange={(e) => setCompleteForm({ ...completeForm, payment_proof_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://example.com/bukti-pembayaran.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal salah satu (file upload atau URL) harus diisi
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Admin</label>
                <textarea
                  rows={3}
                  value={completeForm.admin_notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, admin_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Perhatian!</p>
                    <p>Setelah menyelesaikan pembayaran, RKAM akan diupdate secara otomatis.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedPayment(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Menyelesaikan...' : 'Selesaikan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Detail Pembayaran</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {getStatusIcon(selectedPayment.status)}
                  {selectedPayment.status.toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-bold text-green-600 text-lg">{formatRupiah(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode:</span>
                    <span className="font-medium">{getPaymentMethodLabel(selectedPayment.payment_method)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informasi Penerima</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-medium">{selectedPayment.recipient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rekening:</span>
                    <span className="font-mono">{selectedPayment.recipient_account}</span>
                  </div>
                  {selectedPayment.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{selectedPayment.bank_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayment.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Catatan</h4>
                  <p className="text-sm text-gray-900">{selectedPayment.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayment(null);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Cancel Payment Modal */}
      <CancelModal
        isOpen={cancelModal.isOpen}
        title="Batalkan Pembayaran"
        message={`Apakah Anda yakin ingin membatalkan pembayaran untuk proposal "${cancelModal.payment?.proposal?.title}"?`}
        onConfirm={handleCancelPayment}
        onCancel={() => setCancelModal({ isOpen: false, payment: null })}
        loading={actionLoading}
      />

      {/* Info Modal */}
      <InfoModal
        isOpen={infoModal.isOpen}
        title={infoModal.title}
        message={infoModal.message}
        type={infoModal.type}
        onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
      />
    </div>
  );
};

export default PaymentManagement;