import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { Payment } from '../services/api';
import { apiService } from '../services/api';

interface PaymentProofModalProps {
  isOpen: boolean;
  payment: Payment;
  onClose: () => void;
}

const PaymentProofModal: React.FC<PaymentProofModalProps> = ({ isOpen, payment, onClose }) => {
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await apiService.downloadPaymentProof(payment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get file extension from payment_proof_file
      const fileExt = payment.payment_proof_file?.split('.').pop() || 'pdf';
      a.download = `bukti_pembayaran_${payment.id}.${fileExt}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mendownload bukti pembayaran');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Bukti Pembayaran</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informasi Pembayaran</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Proposal:</p>
                <p className="font-medium text-gray-900">{payment.proposal?.title || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Penerima:</p>
                <p className="font-medium text-gray-900">{payment.recipient_name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Jumlah:</p>
                <p className="font-medium text-green-600 text-lg">{formatRupiah(payment.amount)}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Tanggal Selesai:</p>
                <p className="font-medium text-gray-900">{formatDate(payment.completed_at)}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Metode:</p>
                <p className="font-medium text-gray-900 capitalize">{payment.payment_method}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Status:</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {payment.status === 'completed' ? 'Selesai' : payment.status}
                </span>
              </div>
            </div>
            
            {payment.admin_notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 mb-1 text-xs">Catatan Admin:</p>
                <p className="text-sm text-gray-900">{payment.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Proof Display */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Bukti Transfer</h4>
            
            {/* Uploaded File */}
            {payment.payment_proof_file && (
              <div className="bg-gray-50 rounded-lg p-4">
                {payment.payment_proof_file.endsWith('.pdf') ? (
                  // PDF Preview
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-5 w-5" />
                      <span>File PDF</span>
                    </div>
                    <iframe
                      src={`${API_BASE_URL}/storage/${payment.payment_proof_file}`}
                      className="w-full h-96 border border-gray-200 rounded"
                      title="Payment Proof PDF"
                    />
                  </div>
                ) : (
                  // Image Preview
                  <img
                    src={`${API_BASE_URL}/storage/${payment.payment_proof_file}`}
                    alt="Payment Proof"
                    className="max-w-full h-auto mx-auto rounded border border-gray-200"
                  />
                )}
              </div>
            )}

            {/* URL Link */}
            {payment.payment_proof_url && (
              <a 
                href={payment.payment_proof_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">Lihat Bukti di URL Eksternal</span>
              </a>
            )}

            {!payment.payment_proof_file && !payment.payment_proof_url && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Tidak ada bukti pembayaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleDownload}
            disabled={loading || !payment.payment_proof_file}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{loading ? 'Downloading...' : 'Download File'}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofModal;
