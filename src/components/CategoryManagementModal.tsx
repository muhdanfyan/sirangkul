import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { apiService, Category } from '../services/api';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose, onCategoriesChanged }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await apiService.updateCategory(editingId, formData);
        setToast({ type: 'success', message: 'Kategori berhasil diperbarui' });
      } else {
        await apiService.createCategory(formData);
        setToast({ type: 'success', message: 'Kategori berhasil ditambahkan' });
      }
      setFormData({ name: '', description: '', color: '#3b82f6' });
      setEditingId(null);
      fetchCategories();
      onCategoriesChanged();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Gagal menyimpan kategori' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#3b82f6'
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteCategory(id);
      setToast({ type: 'success', message: 'Kategori berhasil dihapus' });
      fetchCategories();
      onCategoriesChanged();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Gagal menghapus kategori' });
    }
    setConfirmDelete(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Kelola Kategori Anggaran</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Form */}
          <div className="w-full md:w-1/2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kurikulum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Keterangan singkat..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingId ? 'Perbarui' : 'Simpan'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setFormData({ name: '', description: '', color: '#3b82f6' }); }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Daftar Kategori</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">Memuat...</div>
              ) : categories.length === 0 ? (
                <div className="py-8 text-center text-gray-500 italic">Belum ada kategori.</div>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(cat.id)}
                        className="p-1 px-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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

        {/* Footer info */}
        <div className="p-4 bg-gray-50 text-xs text-gray-500 text-center rounded-b-xl">
          Kategori digunakan untuk mengelompokkan anggaran RKAM secara teratur.
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Hapus Kategori"
        message="Apakah Anda yakin? Kategori yang masih digunakan oleh item RKAM tidak dapat dihapus."
        type="danger"
        confirmText="Ya, Hapus"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default CategoryManagementModal;
