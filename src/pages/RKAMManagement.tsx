import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { apiService } from '../services/api';

interface RKAMItem {
  id: string;
  kategori: string;
  item_name: string;
  pagu: number;
  terpakai: number;
  sisa: number;
  persentase: number;
  status: 'Normal' | 'Warning' | 'Critical';
  tahun_anggaran: number;
  deskripsi: string | null;
}

const RKAMManagement: React.FC = () => {
  const [rkamItems, setRkamItems] = useState<RKAMItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    kategori: '',
    item_name: '',
    pagu: 0,
    tahun_anggaran: 2025,
    deskripsi: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch RKAM data from backend
  const fetchRKAMData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getAllRKAM();
      
      // Transform backend data to frontend format
      const transformedData = data.map(item => ({
        id: item.id,
        kategori: item.kategori,
        item_name: item.item_name,
        pagu: typeof item.pagu === 'string' ? parseFloat(item.pagu) : item.pagu,
        terpakai: typeof item.terpakai === 'string' ? parseFloat(item.terpakai) : item.terpakai,
        sisa: typeof item.sisa === 'string' ? parseFloat(item.sisa) : item.sisa,
        persentase: item.persentase,
        status: item.status,
        tahun_anggaran: item.tahun_anggaran,
        deskripsi: item.deskripsi,
      }));
      
      setRkamItems(transformedData);
    } catch (err) {
      console.error('Failed to fetch RKAM data:', err);
      setError('Gagal memuat data RKAM. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchRKAMData();
  }, [fetchRKAMData]);

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing RKAM
        await apiService.updateRKAM(editingId, formData);
      } else {
        // Create new RKAM
        await apiService.createRKAM(formData);
      }
      
      // Refresh data and close modal
      await fetchRKAMData();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save RKAM:', err);
      alert('Gagal menyimpan data RKAM. Silakan coba lagi.');
    }
  };

  // Handle edit button click
  const handleEdit = (item: RKAMItem) => {
    setEditingId(item.id);
    setFormData({
      kategori: item.kategori,
      item_name: item.item_name,
      pagu: item.pagu,
      tahun_anggaran: item.tahun_anggaran,
      deskripsi: item.deskripsi || '',
    });
    setShowModal(true);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item RKAM ini?')) {
      return;
    }

    try {
      await apiService.deleteRKAM(id);
      await fetchRKAMData();
    } catch (err) {
      console.error('Failed to delete RKAM:', err);
      
      // Check if error is because of linked proposals
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('proposals')) {
        alert('Tidak dapat menghapus RKAM. Masih ada proposal yang terkait dengan RKAM ini.');
      } else {
        alert('Gagal menghapus data RKAM. Silakan coba lagi.');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      kategori: '',
      item_name: '',
      pagu: 0,
      tahun_anggaran: 2025,
      deskripsi: '',
    });
    setEditingId(null);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-100 text-green-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Filter by search term and kategori
  const filteredItems = rkamItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.kategori.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = selectedKategori === 'all' || item.kategori === selectedKategori;
    return matchesSearch && matchesKategori;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(rkamItems.map(item => item.kategori)))];

  // Calculate totals
  const totalPagu = rkamItems.reduce((sum, item) => sum + item.pagu, 0);
  const totalTerpakai = rkamItems.reduce((sum, item) => sum + item.terpakai, 0);
  const totalSisa = totalPagu - totalTerpakai;
  const overallPercentage = totalPagu > 0 ? (totalTerpakai / totalPagu) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RKAM Management</h1>
          <p className="text-gray-600 mt-1">Kelola Rencana Kegiatan dan Anggaran Madrasah</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Tambah RKAM
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Tentang RKAM</h3>
            <p className="text-sm text-blue-800">
              RKAM (Rencana Kegiatan dan Anggaran Madrasah) adalah master budget tahunan yang menjadi acuan untuk semua proposal pengajuan. 
              Setiap proposal harus mengacu ke salah satu kategori RKAM dan tidak boleh melebihi sisa anggaran yang tersedia.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pagu</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalPagu)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terpakai</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(totalTerpakai)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sisa Anggaran</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(totalSisa)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Activity className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{overallPercentage.toFixed(1)}%</p>
            </div>
            <div className={`p-3 rounded-lg ${getProgressColor(overallPercentage).replace('bg-', 'bg-opacity-20 bg-')}`}>
              <Activity className={getProgressColor(overallPercentage).replace('bg-', 'text-')} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari nama item atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RKAM Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagu
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terpakai
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sisa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Memuat data RKAM...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={48} className="text-red-400 mb-3" />
                      <p className="font-medium text-red-500">{error}</p>
                      <button
                        onClick={fetchRKAMData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={48} className="text-gray-300 mb-3" />
                      <p className="font-medium">Tidak ada data RKAM</p>
                      <p className="text-sm mt-1">Silakan tambahkan RKAM baru atau ubah filter pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.item_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.tahun_anggaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {formatRupiah(item.pagu)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-green-600">
                      {formatRupiah(item.terpakai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-purple-600">
                      {formatRupiah(item.sisa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(item.persentase)}`}
                            style={{ width: `${Math.min(item.persentase, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-12 text-right">
                          {item.persentase.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit RKAM' : 'Tambah RKAM Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Renovasi">Renovasi</option>
                  <option value="Pengadaan">Pengadaan</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Operasional">Operasional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Item
                </label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Renovasi Gedung Utama"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pagu Anggaran (Rp)
                </label>
                <input
                  type="number"
                  value={formData.pagu}
                  onChange={(e) => setFormData({ ...formData, pagu: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000000"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.pagu > 0 ? formatRupiah(formData.pagu) : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Anggaran
                </label>
                <input
                  type="number"
                  value={formData.tahun_anggaran}
                  onChange={(e) => setFormData({ ...formData, tahun_anggaran: parseInt(e.target.value) || 2025 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2020"
                  max="2100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Deskripsi detail tentang anggaran ini..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RKAMManagement;