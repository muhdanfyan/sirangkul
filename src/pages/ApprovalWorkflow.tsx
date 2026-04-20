import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiService, Proposal } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isProposalAwaitingApproval } from '../utils/proposalWorkflow';

type ApprovalRole = 'Verifikator' | 'Kepala Madrasah' | 'Komite Madrasah';

const ROLE_CONFIG: Record<
  ApprovalRole,
  {
    title: string;
    description: string;
    status: Proposal['status'];
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  Verifikator: {
    title: 'Antrian Verifikasi',
    description: 'Proposal yang menunggu verifikasi awal oleh verifikator.',
    status: 'submitted',
    emptyTitle: 'Tidak ada proposal menunggu verifikasi',
    emptyDescription: 'Proposal dengan status menunggu verifikasi akan muncul di sini.',
  },
  'Kepala Madrasah': {
    title: 'Antrian Persetujuan Kepala',
    description: 'Proposal yang sudah disetujui komite dan menunggu persetujuan Kepala Madrasah.',
    status: 'approved',
    emptyTitle: 'Tidak ada proposal menunggu persetujuan kepala',
    emptyDescription: 'Proposal yang sudah disetujui komite akan muncul di sini.',
  },
  'Komite Madrasah': {
    title: 'Antrian Persetujuan Komite',
    description: 'Proposal yang sudah diverifikasi dan menunggu persetujuan Komite Madrasah.',
    status: 'verified',
    emptyTitle: 'Tidak ada proposal menunggu persetujuan komite',
    emptyDescription: 'Proposal yang lolos verifikasi akan muncul di sini.',
  },
};

const ApprovalWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const role = user?.role as ApprovalRole | undefined;
  const roleConfig = role ? ROLE_CONFIG[role] : undefined;

  useEffect(() => {
    if (!roleConfig) {
      setLoading(false);
      return;
    }

    fetchApprovalQueue();
  }, [roleConfig]);

  const fetchApprovalQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const allProposals = await apiService.getAllProposals();
      setProposals(allProposals);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat antrian persetujuan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCurrentQueue = () => {
    if (!roleConfig) return [];

    return proposals.filter((proposal) => {
      if (!isProposalAwaitingApproval(user, proposal)) {
        return false;
      }

      if (!searchTerm.trim()) {
        return true;
      }

      const keyword = searchTerm.toLowerCase();
      const proposerName = proposal.user?.full_name || proposal.user?.name || '';
      const rkamName = proposal.rkam?.item_name || '';

      return (
        proposal.title.toLowerCase().includes(keyword)
        || proposerName.toLowerCase().includes(keyword)
        || rkamName.toLowerCase().includes(keyword)
      );
    });
  };

  const queuedProposals = getCurrentQueue();
  const totalNominal = queuedProposals.reduce((sum, proposal) => {
    const amount = typeof proposal.jumlah_pengajuan === 'string'
      ? parseFloat(proposal.jumlah_pengajuan)
      : proposal.jumlah_pengajuan;

    return sum + amount;
  }, 0);

  const highPriorityCount = queuedProposals.filter((proposal) =>
    proposal.urgency === 'Tinggi' || proposal.urgency === 'Mendesak',
  ).length;

  if (!roleConfig) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h1 className="text-lg font-semibold text-yellow-900">Akses tidak tersedia</h1>
            <p className="text-sm text-yellow-800 mt-1">
              Halaman ini hanya digunakan oleh Verifikator, Kepala Madrasah, dan Komite Madrasah.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-red-900">Gagal memuat antrian persetujuan</h1>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchApprovalQueue}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{roleConfig.title}</h1>
          <p className="text-gray-600 mt-1">{roleConfig.description}</p>
        </div>
        <button
          onClick={fetchApprovalQueue}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Menunggu Diproses</p>
              <p className="text-2xl font-bold text-gray-900">{queuedProposals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Prioritas Tinggi</p>
              <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Nominal</p>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(totalNominal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari judul proposal, pengusul, atau RKAM..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Proposal</h2>
          <p className="text-sm text-gray-600">Buka detail proposal untuk meninjau dokumen dan memberikan keputusan.</p>
        </div>

        {queuedProposals.length === 0 ? (
          <div className="px-6 py-14 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">{roleConfig.emptyTitle}</p>
            <p className="text-sm mt-1">{roleConfig.emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengusul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RKAM</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgensi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queuedProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{proposal.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {proposal.bidang || proposal.rkam?.bidang || proposal.rkam?.kategori || 'Tanpa bidang'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {proposal.user?.full_name || proposal.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {proposal.rkam?.item_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatRupiah(proposal.jumlah_pengajuan)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          proposal.urgency === 'Mendesak'
                            ? 'bg-red-100 text-red-800'
                            : proposal.urgency === 'Tinggi'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {proposal.urgency || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(proposal.submitted_at || proposal.verified_at || proposal.approved_at || proposal.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          Tinjau Proposal
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
    </div>
  );
};

export default ApprovalWorkflow;
