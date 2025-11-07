import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface CancelModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Alasan pembatalan harus diisi');
      return;
    }
    onConfirm(reason);
    setReason(''); // Reset after confirm
  };

  const handleCancel = () => {
    setReason(''); // Reset on cancel
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" />
            <p className="text-gray-600">{message}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Pembatalan *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Jelaskan alasan pembatalan..."
              disabled={loading}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Ya, Batalkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;
