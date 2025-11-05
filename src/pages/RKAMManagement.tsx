import React, { useState, useEffect } from 'react';
import { Search, CreditCard as Edit, TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';

interface RKAMItem {
  id: string;
  item_name: string;
  pagu: number; // This will be total_price from backend (total budget for this item)
  terpakai: number; // To be calculated based on proposals (will be 0 for now)
  sisa: number; // pagu - terpakai
  persentase: number; // (terpakai / pagu) * 100
  status: 'Normal' | 'Warning' | 'Critical';
  quantity: number;
  unit_price: number;
}

const RKAMManagement: React.FC = () => {
  const [rkamItems, setRkamItems] = useState<RKAMItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch RKAM data from backend
  const fetchRKAMData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getAllRKAM();
      
      // Check if endpoint is available
      if (!data || data.length === 0) {
        setError(null); // Clear error, just show empty state
        setRkamItems([]);
        return;
      }
      
      // Transform backend RKAM data to RKAMItem format
      const transformedData = data.map(item => {
        // Convert string to number if needed
        const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price;
        const totalPrice = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
        
        const pagu = totalPrice; // total_price is the budget (pagu)
        const terpakai = 0; // TODO: Calculate from proposals when available
        const sisa = pagu - terpakai;
        const persentase = pagu > 0 ? (terpakai / pagu) * 100 : 0;
        
        // Calculate status based on percentage
        let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
        if (persentase >= 90) status = 'Critical';
        else if (persentase >= 75) status = 'Warning';

        return {
          id: item.id,
          item_name: item.item_name,
          pagu,
          terpakai,
          sisa,
          persentase,
          status,
          quantity: item.quantity,
          unit_price: unitPrice,
        };
      });
      
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
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchRKAMData();
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, [fetchRKAMData]);

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing RKAM
        await apiService.updateRKAM(editingId, formData);
      } else {
        // Create new RKAM - Note: We need proposal_id from somewhere
        // For now, we'll skip this since RKAM is tied to proposals
        alert('Untuk menambah RKAM baru, silakan lakukan dari halaman Proposal');
        return;
      }
      
      // Refresh data and close modal
      await fetchRKAMData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save RKAM:', err);
      alert('Gagal menyimpan data RKAM');
    }
  };

  // Handle edit button click
  const handleEdit = (item: RKAMItem) => {
    setEditingId(item.id);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
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
      alert('Gagal menghapus data RKAM');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      item_name: '',
      quantity: 1,
      unit_price: 0,
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
    }).format(number);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Normal': 'bg-green-100 text-green-800',
      'Warning': 'bg-yellow-100 text-yellow-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const filteredItems = rkamItems.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPagu = rkamItems.reduce((sum, item) => sum + (item.pagu || 0), 0);
  const totalTerpakai = rkamItems.reduce((sum, item) => sum + (item.terpakai || 0), 0);
  const totalSisa = totalPagu - totalTerpakai;
  const overallPercentage = totalPagu > 0 ? (totalTerpakai / totalPagu) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RKAM Management</h1>
          <p className="text-gray-600 mt-1">Rencana Kerja dan Anggaran Madrasah</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Informasi RKAM</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Item RKAM dibuat melalui proses pengajuan proposal. Data yang ditampilkan adalah ringkasan dari semua item RKAM yang terhubung dengan proposal.</p>
            </div>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terpakai</p>
              <p className="text-2xl font-bold text-red-600">{formatRupiah(totalTerpakai)}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sisa Anggaran</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(totalSisa)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progress Keseluruhan</h3>
          <span className="text-sm text-gray-600">{overallPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${getProgressColor(overallPercentage)}`}
            style={{ width: `${overallPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama item RKAM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* RKAM Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Nama Item</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Qty</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Harga Satuan</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Pagu</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Terpakai</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Sisa</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Progress</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500">Memuat data RKAM...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-500 font-medium">{error}</p>
                      <button 
                        onClick={fetchRKAMData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium mb-2">Belum ada data RKAM</p>
                      <p className="text-gray-400 text-sm max-w-md">
                        Endpoint backend <code className="bg-gray-100 px-2 py-1 rounded">GET /api/rkam</code> belum tersedia. 
                        Silakan hubungi backend developer untuk menambahkan endpoint ini.
                      </p>
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-lg">
                        <p className="text-yellow-800 text-sm">
                          <strong>Untuk Backend Developer:</strong> Lihat file <code>BACKEND_TODO.md</code> dan <code>SAMPLE_RKAM_DATA.md</code> untuk implementasi endpoint.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{item.item_name}</div>
                    </td>
                    <td className="py-4 px-6 text-right">{item.quantity}</td>
                    <td className="py-4 px-6 text-right">{formatRupiah(item.unit_price)}</td>
                    <td className="py-4 px-6 text-right font-medium">{formatRupiah(item.pagu)}</td>
                    <td className="py-4 px-6 text-right text-red-600 font-medium">{formatRupiah(item.terpakai)}</td>
                    <td className="py-4 px-6 text-right text-green-600 font-medium">{formatRupiah(item.sisa)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(item.persentase)}`}
                            style={{ width: `${item.persentase}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-8 text-right">{item.persentase.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit RKAM Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Item RKAM' : 'Tambah Item RKAM'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Laptop Dell"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kuantitas</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jumlah item"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                <input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Harga per unit"
                  min="0"
                  required
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Pagu (Budget):</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatRupiah(formData.quantity * formData.unit_price)}
                </div>
              </div>
            </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                type="button"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RKAMManagement;