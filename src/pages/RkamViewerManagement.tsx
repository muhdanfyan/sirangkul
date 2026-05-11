import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService, RkamViewerDocument } from '../services/api';

type ToastState = { type: 'success' | 'error' | 'info' | 'warning'; message: string };
type DocumentFormState = {
  name: string;
  description: string;
  is_visible: boolean;
  file: File | null;
};

const SUPERADMIN_EMAIL = 'superadmin@sirangkul.sch.id';
const DEFAULT_LIMITS = { max_total: 8, max_visible: 4 };
const EMPTY_FORM: DocumentFormState = {
  name: '',
  description: '',
  is_visible: false,
  file: null,
};

const RkamViewerManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<RkamViewerDocument[]>([]);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [form, setForm] = useState<DocumentFormState>(EMPTY_FORM);
  const [editingDocument, setEditingDocument] = useState<RkamViewerDocument | null>(null);
  const [editForm, setEditForm] = useState<DocumentFormState>(EMPTY_FORM);
  const [toast, setToast] = useState<ToastState | null>(null);

  const isAllowed = (user?.email || '').toLowerCase() === SUPERADMIN_EMAIL;
  const visibleCount = useMemo(() => documents.filter((document) => document.is_visible).length, [documents]);
  const slotsLeft = Math.max(limits.max_total - documents.length, 0);
  const visibleSlotsLeft = Math.max(limits.max_visible - visibleCount, 0);

  const loadDocuments = useCallback(async () => {
    if (!isAllowed) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.getRkamViewerDocuments();
      setDocuments(response.data);
      setLimits({
        max_total: response.meta?.max_total || DEFAULT_LIMITS.max_total,
        max_visible: response.meta?.max_visible || DEFAULT_LIMITS.max_visible,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat dokumen RAKM viewer.';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [isAllowed]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const formatFileSize = (size?: number) => {
    if (!size) return '-';
    const mb = size / 1024 / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.max(size / 1024, 1).toFixed(0)} KB`;
  };

  const appendFormData = (payload: DocumentFormState, includeFile: boolean) => {
    const formData = new FormData();
    formData.append('name', payload.name.trim());
    formData.append('description', payload.description.trim());
    formData.append('is_visible', payload.is_visible ? '1' : '0');

    if (includeFile && payload.file) {
      formData.append('file', payload.file);
    }

    return formData;
  };

  const resetCreateForm = () => {
    setForm({ ...EMPTY_FORM });
    const fileInput = document.getElementById('rkam-viewer-file') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.file) {
      setToast({ type: 'warning', message: 'Pilih file yang akan diunggah terlebih dahulu.' });
      return;
    }

    if (documents.length >= limits.max_total) {
      setToast({ type: 'warning', message: 'Kuota maksimal 8 file sudah penuh.' });
      return;
    }

    if (form.is_visible && visibleCount >= limits.max_visible) {
      setToast({ type: 'warning', message: 'Maksimal 4 file boleh tampil di halaman publik.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await apiService.createRkamViewerDocument(appendFormData(form, true));
      setDocuments((current) => [...current, created].sort((a, b) => a.display_order - b.display_order));
      resetCreateForm();
      setToast({ type: 'success', message: 'Dokumen berhasil diunggah.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah dokumen.';
      setToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (document: RkamViewerDocument) => {
    setEditingDocument(document);
    setEditForm({
      name: document.name,
      description: document.description || '',
      is_visible: document.is_visible,
      file: null,
    });
  };

  const closeEdit = () => {
    setEditingDocument(null);
    setEditForm({ ...EMPTY_FORM });
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingDocument) return;

    if (!editingDocument.is_visible && editForm.is_visible && visibleCount >= limits.max_visible) {
      setToast({ type: 'warning', message: 'Maksimal 4 file boleh tampil di halaman publik.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await apiService.updateRkamViewerDocument(
        editingDocument.id,
        appendFormData(editForm, Boolean(editForm.file)),
      );

      setDocuments((current) => current.map((document) => (document.id === updated.id ? updated : document)));
      closeEdit();
      setToast({ type: 'success', message: 'Dokumen berhasil diperbarui.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memperbarui dokumen.';
      setToast({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (document: RkamViewerDocument) => {
    const nextVisible = !document.is_visible;

    if (nextVisible && visibleCount >= limits.max_visible) {
      setToast({ type: 'warning', message: 'Maksimal 4 file boleh tampil di halaman publik.' });
      return;
    }

    const formData = new FormData();
    formData.append('is_visible', nextVisible ? '1' : '0');

    try {
      const updated = await apiService.updateRkamViewerDocument(document.id, formData);
      setDocuments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setToast({ type: 'success', message: nextVisible ? 'Dokumen ditampilkan.' : 'Dokumen disembunyikan.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengubah status tampil dokumen.';
      setToast({ type: 'error', message });
    }
  };

  const persistOrder = async (orderedDocuments: RkamViewerDocument[]) => {
    try {
      setIsReordering(true);
      await apiService.reorderRkamViewerDocuments(orderedDocuments.map((document) => document.id));
      setToast({ type: 'success', message: 'Urutan dokumen berhasil disimpan.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan urutan dokumen.';
      setToast({ type: 'error', message });
      loadDocuments();
    } finally {
      setIsReordering(false);
    }
  };

  const moveDocument = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= documents.length) return;

    const nextDocuments = [...documents];
    [nextDocuments[index], nextDocuments[targetIndex]] = [nextDocuments[targetIndex], nextDocuments[index]];
    const reindexed = nextDocuments.map((document, orderIndex) => ({
      ...document,
      display_order: orderIndex + 1,
    }));

    setDocuments(reindexed);
    persistOrder(reindexed);
  };

  const handleDelete = async (document: RkamViewerDocument) => {
    if (!window.confirm(`Hapus dokumen "${document.name}" dari manajemen RAKM viewer?`)) {
      return;
    }

    try {
      await apiService.deleteRkamViewerDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setToast({ type: 'success', message: 'Dokumen berhasil dihapus.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus dokumen.';
      setToast({ type: 'error', message });
    }
  };

  if (!isAllowed) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <EyeOff className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Akses Ditolak</h1>
            <p className="mt-2 text-sm text-gray-600">
              Menu manajemen RAKM viewer hanya tersedia untuk akun superadmin@sirangkul.sch.id.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Pengaturan Publik</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Manajemen RAKM Viewer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Atur file yang tampil di halaman transparansi publik. Total tersimpan maksimal 8 file, tampil maksimal 4 file.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDocuments}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total File</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{documents.length}/{limits.max_total}</p>
          <p className="mt-1 text-xs text-gray-500">Sisa slot upload: {slotsLeft}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tampil Publik</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{visibleCount}/{limits.max_visible}</p>
          <p className="mt-1 text-xs text-gray-500">Sisa slot tampil: {visibleSlotsLeft}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Urutan</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{isReordering ? 'Menyimpan' : 'Aktif'}</p>
          <p className="mt-1 text-xs text-gray-500">Urutan publik mengikuti posisi daftar ini.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Upload File Baru</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Nama Tampilan</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Opsional, default mengikuti nama file"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">File</label>
            <input
              id="rkam-viewer-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={2}
              placeholder="Deskripsi singkat yang muncul di kartu dokumen publik"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.is_visible}
              disabled={!form.is_visible && visibleCount >= limits.max_visible}
              onChange={(event) => setForm((current) => ({ ...current, is_visible: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Tampilkan langsung di halaman publik
          </label>
          <button
            type="submit"
            disabled={isSubmitting || documents.length >= limits.max_total}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Upload Dokumen
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Daftar File RAKM Viewer</h2>
          <p className="mt-1 text-sm text-gray-500">Gunakan tombol panah untuk mengatur urutan tampil.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat dokumen...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-600">Belum ada dokumen.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3">Urutan</th>
                  <th className="px-5 py-3">Dokumen</th>
                  <th className="px-5 py-3">Ukuran</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((document, index) => (
                  <tr key={document.id} className="hover:bg-blue-50/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveDocument(index, -1)}
                          disabled={index === 0 || isReordering}
                          className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                          title="Naikkan urutan"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDocument(index, 1)}
                          disabled={index === documents.length - 1 || isReordering}
                          className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-30"
                          title="Turunkan urutan"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-red-50 p-2 text-red-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{document.name}</p>
                          <p className="mt-1 max-w-lg text-xs text-gray-500">{document.description || 'Tanpa deskripsi'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatFileSize(document.file_size)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${document.is_visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {document.is_visible ? 'Tampil' : 'Disembunyikan'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <a
                          href={document.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-blue-600"
                          title="Lihat file"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(document)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-blue-600"
                          title={document.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {document.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(document)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-blue-600"
                          title="Edit atau ganti file"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(document)}
                          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-white hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleUpdate} className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Dokumen</h2>
                <p className="text-sm text-gray-500">Ganti metadata atau unggah file pengganti.</p>
              </div>
              <button type="button" onClick={closeEdit} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Nama Tampilan</label>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Deskripsi</label>
                <textarea
                  value={editForm.description}
                  onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">File Pengganti</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(event) => setEditForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700"
                />
                <p className="mt-1 text-xs text-gray-400">Kosongkan jika hanya mengubah nama, deskripsi, atau status tampil.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.is_visible}
                  disabled={!editingDocument.is_visible && !editForm.is_visible && visibleCount >= limits.max_visible}
                  onChange={(event) => setEditForm((current) => ({ ...current, is_visible: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Tampilkan di halaman publik
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={closeEdit} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RkamViewerManagement;
