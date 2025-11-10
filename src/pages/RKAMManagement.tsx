import React, { useState } from 'react';
import { Plus, Search, CreditCard as Edit, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RKAMItem {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  pagu: number;
  terpakai: number;
  sisa: number;
  persentase: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

const RKAMManagement: React.FC = () => {
  const [rkamItems] = useState<RKAMItem[]>([
    {
      id: '1',
      kodeRekening: '5.1.1.01',
      namaRekening: 'Belanja Gaji Pokok PNS',
      pagu: 2500000000,
      terpakai: 1800000000,
      sisa: 700000000,
      persentase: 72,
      status: 'Normal'
    },
    {
      id: '2',
      kodeRekening: '5.1.1.02',
      namaRekening: 'Belanja Tunjangan Keluarga',
      pagu: 500000000,
      terpakai: 380000000,
      sisa: 120000000,
      persentase: 76,
      status: 'Normal'
    },
    {
      id: '3',
      kodeRekening: '5.2.1.01',
      namaRekening: 'Belanja Bahan',
      pagu: 300000000,
      terpakai: 280000000,
      sisa: 20000000,
      persentase: 93,
      status: 'Critical'
    },
    {
      id: '4',
      kodeRekening: '5.2.2.01',
      namaRekening: 'Belanja Jasa',
      pagu: 150000000,
      terpakai: 90000000,
      sisa: 60000000,
      persentase: 60,
      status: 'Normal'
    },
    {
      id: '5',
      kodeRekening: '5.2.3.01',
      namaRekening: 'Belanja Pemeliharaan',
      pagu: 200000000,
      terpakai: 160000000,
      sisa: 40000000,
      persentase: 80,
      status: 'Warning'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

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
    item.kodeRekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.namaRekening.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPagu = rkamItems.reduce((sum, item) => sum + item.pagu, 0);
  const totalTerpakai = rkamItems.reduce((sum, item) => sum + item.terpakai, 0);
  const totalSisa = totalPagu - totalTerpakai;
  const overallPercentage = (totalTerpakai / totalPagu) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RKAM Management</h1>
          <p className="text-gray-600 mt-1">Rencana Kerja dan Anggaran Madrasah</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item RKAM
        </button>
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
            placeholder="Cari kode atau nama rekening..."
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
                <th className="text-left py-3 px-6 font-medium text-gray-700">Kode</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Nama Rekening</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Pagu</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Terpakai</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Sisa</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Progress</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono text-sm">{item.kodeRekening}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{item.namaRekening}</div>
                  </td>
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
                      <span className="text-xs text-gray-600 w-8 text-right">{item.persentase}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add RKAM Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Item RKAM</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Rekening</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 5.1.1.03"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rekening</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama rekening"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pagu Anggaran</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan pagu anggaran"
                />
              </div>
            </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RKAMManagement;