import React, { useEffect, useState } from 'react';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { apiService, Bidang } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [bidangs, setBidangs] = useState<Bidang[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
    });
  };

  const fetchBidangs = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAllBidangs();
      setBidangs(data);
    } catch (error) {
      console.error('Failed to fetch bidangs:', error);
      setToast({ type: 'error', message: 'Gagal memuat daftar bidang.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBidangs();
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        await apiService.updateBidang(editingId, formData);
        setToast({ type: 'success', message: 'Bidang berhasil diperbarui.' });
      } else {
        await apiService.createBidang(formData);
        setToast({ type: 'success', message: 'Bidang berhasil ditambahkan.' });
      }

      resetForm();
      await fetchBidangs();
      onCategoriesChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan bidang.';
      setToast({ type: 'error', message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (bidang: Bidang) => {
    setEditingId(bidang.id);
    setFormData({
      name: bidang.name,
      description: bidang.description || '',
      color: bidang.color || '#3b82f6',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteBidang(id);
      setToast({ type: 'success', message: 'Bidang berhasil dihapus.' });
      await fetchBidangs();
      onCategoriesChanged();
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus bidang.';
      setToast({ type: 'error', message });
    } finally {
      setConfirmDelete(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">Kelola Bidang RKAM</h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-auto p-6 md:flex-row">
          <div className="w-full md:w-1/2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {editingId ? 'Edit Bidang' : 'Tambah Bidang Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Bidang</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Contoh: Pendidikan"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Keterangan singkat bidang..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Warna</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(event) => setFormData((prev) => ({ ...prev, color: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 py-1"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingId ? 'Perbarui' : 'Simpan'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="w-full border-t pt-6 md:w-1/2 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Daftar Bidang</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">Memuat...</div>
              ) : bidangs.length === 0 ? (
                <div className="py-8 text-center italic text-gray-500">Belum ada bidang.</div>
              ) : (
                bidangs.map((bidang) => (
                  <div key={bidang.id} className="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: bidang.color || '#3b82f6' }} />
                      <div>
                        <p className="font-medium text-gray-900">{bidang.name}</p>
                        {bidang.description && (
                          <p className="text-xs text-gray-500">{bidang.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(bidang)}
                        className="rounded px-2 py-1 text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(bidang.id)}
                        className="rounded px-2 py-1 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-b-xl bg-gray-50 p-4 text-center text-xs text-gray-500">
          Bidang digunakan untuk membatasi RKAM, proposal, dan antrian approval per role.
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Hapus Bidang"
        message="Bidang yang masih dipakai oleh user, RKAM, atau proposal tidak dapat dihapus. Lanjutkan?"
        type="danger"
        confirmText="Ya, Hapus"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default CategoryManagementModal;
