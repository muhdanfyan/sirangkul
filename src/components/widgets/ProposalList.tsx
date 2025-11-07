import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, Proposal } from '../../services/api';
import { Plus, Search, Filter } from 'lucide-react';

const ProposalList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    const loadProposals = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getAllProposals(filters.status ? { status: filters.status } : undefined);
        setProposals(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals';
        setError(errorMessage);
        console.error('Error fetching proposals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProposals();
  }, [filters]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllProposals(filters.status ? { status: filters.status } : undefined);
      setProposals(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals';
      setError(errorMessage);
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus proposal ini?')) {
      return;
    }

    try {
      await apiService.deleteProposal(id);
      alert('Proposal berhasil dihapus');
      fetchProposals(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus proposal';
      alert(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      verified: 'bg-cyan-100 text-cyan-800',
      approved: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      final_approved: 'bg-green-100 text-green-800',
      payment_processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
    };
    
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Menunggu Verifikasi',
      verified: 'Terverifikasi',
      approved: 'Disetujui Kepala',
      rejected: 'Ditolak',
      final_approved: 'Disetujui Akhir',
      payment_processing: 'Proses Pembayaran',
      completed: 'Selesai',
    };
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatRupiah = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchProposals}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Proposal</h1>
          <p className="text-gray-600 mt-1">Kelola proposal pengajuan anggaran</p>
        </div>
        <Link
          to="/proposal-submission"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Buat Proposal Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Menunggu Verifikasi</option>
            <option value="verified">Terverifikasi</option>
            <option value="approved">Disetujui Kepala</option>
            <option value="rejected">Ditolak</option>
            <option value="final_approved">Disetujui Akhir</option>
            <option value="payment_processing">Proses Pembayaran</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RKAM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Pengajuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search size={48} className="text-gray-300 mb-3" />
                      <p className="font-medium">Tidak ada proposal</p>
                      <p className="text-sm mt-1">Silakan buat proposal baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                proposals.map((proposal, index) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{proposal.title}</div>
                      {proposal.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {proposal.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {proposal.rkam ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {proposal.rkam.item_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {proposal.rkam.kategori}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {formatRupiah(proposal.jumlah_pengajuan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(proposal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proposal.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <Link
                        to={`/proposals/${proposal.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Detail
                      </Link>
                      {proposal.status === 'draft' ? (
                        <>
                          <Link
                            to={`/proposals/${proposal.id}/edit`}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(proposal.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </>
                      ) : (
                        <Link
                          to={`/proposals/${proposal.id}/approval`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Approval
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProposalList;
