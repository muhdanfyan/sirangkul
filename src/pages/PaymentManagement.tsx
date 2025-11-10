import React, { useState } from 'react';
import { CreditCard, DollarSign, Receipt, CheckCircle, Clock, Search } from 'lucide-react';

interface Payment {
  id: string;
  proposalId: string;
  proposalTitle: string;
  amount: number;
  recipient: string;
  paymentDate: string;
  status: 'Pending' | 'Processed' | 'Completed';
  paymentMethod: string;
  accountNumber?: string;
  notes?: string;
}

const PaymentManagement: React.FC = () => {
  const [payments] = useState<Payment[]>([
    {
      id: 'PAY001',
      proposalId: 'PR002',
      proposalTitle: 'Pembelian Komputer Lab',
      amount: 25000000,
      recipient: 'CV. Teknologi Maju',
      paymentDate: '2025-01-14',
      status: 'Completed',
      paymentMethod: 'Transfer Bank',
      accountNumber: '1234567890',
      notes: 'Pembayaran untuk pengadaan 10 unit komputer'
    },
    {
      id: 'PAY002',
      proposalId: 'PR005',
      proposalTitle: 'Pelatihan Guru Digital',
      amount: 12000000,
      recipient: 'PT. Edukasi Digital',
      paymentDate: '2025-01-16',
      status: 'Pending',
      paymentMethod: 'Transfer Bank',
      accountNumber: '0987654321',
      notes: 'Pembayaran program pelatihan guru selama 3 hari'
    },
    {
      id: 'PAY003',
      proposalId: 'PR008',
      proposalTitle: 'Renovasi Perpustakaan',
      amount: 18500000,
      recipient: 'PT. Bangun Mandiri',
      paymentDate: '2025-01-15',
      status: 'Processed',
      paymentMethod: 'Transfer Bank',
      accountNumber: '5678901234'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Processed':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.proposalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const processPayment = (payment: Payment) => {
    alert(`Pembayaran ${payment.id} telah diproses!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pembayaran</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran proposal yang telah disetujui</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Proses Pembayaran
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pembayaran</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalAmount)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">{payments.length} transaksi</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sudah Dibayar</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(completedAmount)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {payments.filter(p => p.status === 'Completed').length} selesai
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600">{formatRupiah(pendingAmount)}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              {payments.filter(p => p.status === 'Pending').length} pending
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatRupiah(totalAmount / payments.length)}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">per transaksi</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Pembayaran</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Penerima</th>
                <th className="text-right py-3 px-6 font-medium text-gray-700">Jumlah</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Tanggal</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{payment.proposalTitle}</div>
                      <div className="text-sm text-gray-600">ID: {payment.id}</div>
                      <div className="text-xs text-gray-500">Proposal: {payment.proposalId}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{payment.recipient}</div>
                      {payment.accountNumber && (
                        <div className="text-sm text-gray-600">Rekening: {payment.accountNumber}</div>
                      )}
                      <div className="text-xs text-gray-500">{payment.paymentMethod}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-lg">
                    {formatRupiah(payment.amount)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center mb-1">
                      {getStatusIcon(payment.status)}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-gray-600">
                    {payment.paymentDate}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                      {payment.status === 'Pending' && (
                        <button 
                          onClick={() => processPayment(payment)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Detail Pembayaran</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">ID Pembayaran:</span>
                <div className="font-medium">{selectedPayment.id}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Proposal:</span>
                <div className="font-medium">{selectedPayment.proposalTitle}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Penerima:</span>
                <div className="font-medium">{selectedPayment.recipient}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Jumlah:</span>
                <div className="font-bold text-lg text-blue-600">{formatRupiah(selectedPayment.amount)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Metode:</span>
                <div className="font-medium">{selectedPayment.paymentMethod}</div>
              </div>
              {selectedPayment.accountNumber && (
                <div>
                  <span className="text-sm text-gray-600">No. Rekening:</span>
                  <div className="font-medium">{selectedPayment.accountNumber}</div>
                </div>
              )}
              {selectedPayment.notes && (
                <div>
                  <span className="text-sm text-gray-600">Catatan:</span>
                  <div className="text-sm">{selectedPayment.notes}</div>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Proses Pembayaran Baru</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Pilih Proposal</option>
                  <option value="PR009">PR009 - Renovasi Kantin</option>
                  <option value="PR010">PR010 - Pembelian Buku</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama penerima"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan jumlah"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nomor rekening"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Catatan pembayaran"
                />
              </div>
            </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;