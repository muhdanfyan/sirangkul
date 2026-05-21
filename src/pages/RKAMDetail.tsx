import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Layers,
  Wallet,
} from 'lucide-react';
import Toast from '../components/Toast';
import { apiService, Payment, Proposal, RKAM } from '../services/api';
import { parseAmountValue } from '../utils/currency';
import { getPaymentStatusLabel } from '../utils/paymentStatus';
import { applyCompletedPaymentUsageToRKAM } from '../utils/rkamBudget';

const formatIDR = (num: number) => (
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
);

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getProposalStatusConfig = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    submitted: { label: 'Menunggu Verifikator', className: 'bg-blue-100 text-blue-700' },
    verified: { label: 'Menunggu Kepala Madrasah', className: 'bg-cyan-100 text-cyan-700' },
    approved: { label: 'Menunggu Ketua Komite', className: 'bg-purple-100 text-purple-700' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
    final_approved: { label: 'Siap Dibayar', className: 'bg-green-100 text-green-700' },
    payment_processing: { label: 'Proses Pembayaran', className: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Sudah Terbayar', className: 'bg-emerald-100 text-emerald-700' },
  };

  return config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
};

const getProgressColor = (percentage: number) => {
  if (percentage > 90) return 'bg-red-500';
  if (percentage > 75) return 'bg-orange-500';
  return 'bg-green-500';
};

const RKAMDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rkam, setRkam] = useState<RKAM | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setErrorMessage('ID RKAM tidak valid.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [detailResult, paymentResult] = await Promise.allSettled([
        apiService.getRKAMProposals(id),
        apiService.getAllPayments(),
      ]);

      if (detailResult.status !== 'fulfilled') {
        throw detailResult.reason;
      }

      const nextPayments = paymentResult.status === 'fulfilled' ? paymentResult.value : [];
      if (paymentResult.status !== 'fulfilled') {
        console.warn('Failed to sync completed payment usage for RKAM detail:', paymentResult.reason);
      }

      const [normalizedRkam] = applyCompletedPaymentUsageToRKAM([detailResult.value.rkam], nextPayments);
      setRkam(normalizedRkam || detailResult.value.rkam);
      setProposals(detailResult.value.proposals);
      setPayments(nextPayments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat detail RKAM.';
      setErrorMessage(message);
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const getPaymentByProposalId = useCallback((proposalId: string) => (
    payments.find((payment) => payment.proposal_id === proposalId)
  ), [payments]);

  const detailSummary = useMemo(() => {
    const totalPengajuan = proposals.reduce((sum, proposal) => (
      sum + parseAmountValue(proposal.jumlah_pengajuan)
    ), 0);

    const totalTerbayar = proposals.reduce((sum, proposal) => {
      const payment = getPaymentByProposalId(proposal.id);
      if (payment?.status !== 'completed') {
        return sum;
      }

      return sum + parseAmountValue(payment.amount);
    }, 0);

    return {
      totalProposal: proposals.length,
      totalPengajuan,
      totalTerbayar,
    };
  }, [getPaymentByProposalId, proposals]);

  const bidangName = rkam?.bidangRef?.name || rkam?.bidang || rkam?.category?.name || rkam?.kategori || '-';
  const terpakai = Number(rkam?.terpakai_filtered ?? rkam?.terpakai ?? 0);
  const sisa = Number(rkam?.sisa_filtered ?? rkam?.sisa ?? 0);
  const persentase = Number(rkam?.persentase_filtered ?? rkam?.persentase ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (errorMessage || !rkam) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/rkam')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Kembali ke RKAM
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {errorMessage || 'Detail RKAM tidak ditemukan.'}
        </div>
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link
            to="/rkam"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={16} />
            Kembali ke RKAM
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Detail RKAM</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{rkam.item_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Layers size={15} />
                {bidangName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={15} />
                Tahun Anggaran {rkam.tahun_anggaran}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDetail}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <CheckCircle size={16} />
          Muat Ulang
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Uraian</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {rkam.deskripsi || rkam.description || 'Tidak ada deskripsi tambahan untuk RKAM ini.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Volume</p>
              <p className="mt-1 font-bold text-gray-900">{rkam.volume} {rkam.satuan}</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Harga Satuan</p>
              <p className="mt-1 font-bold text-gray-900">{formatIDR(Number(rkam.unit_price))}</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50/40 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600">Dana BOS</p>
              <p className="mt-1 font-bold text-green-700">{formatIDR(Number(rkam.dana_bos || 0))}</p>
            </div>
            <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600">Dana Komite</p>
              <p className="mt-1 font-bold text-purple-700">{formatIDR(Number(rkam.dana_komite || 0))}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Pagu RKAM</p>
          <p className="mt-2 text-lg font-black text-gray-900">{formatIDR(Number(rkam.pagu))}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Terpakai</p>
          <p className="mt-2 text-lg font-black text-orange-700">{formatIDR(terpakai)}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600">Sisa</p>
          <p className="mt-2 text-lg font-black text-green-700">{formatIDR(sisa)}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Total Pengajuan</p>
          <p className="mt-2 text-lg font-black text-blue-700">{formatIDR(detailSummary.totalPengajuan)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Total Terbayar</p>
          <p className="mt-2 text-lg font-black text-emerald-700">{formatIDR(detailSummary.totalTerbayar)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Penyerapan Anggaran</p>
            <p className="mt-1 text-sm text-gray-500">{persentase.toFixed(1)}% dari pagu sudah digunakan.</p>
          </div>
          <Wallet className="text-gray-300" size={28} />
        </div>
        <div className="mt-4 h-2 rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full ${getProgressColor(persentase)}`}
            style={{ width: `${Math.min(persentase, 100)}%` }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Proposal Terkait</h2>
            <p className="text-sm text-gray-500">Total {detailSummary.totalProposal} proposal menggunakan RKAM ini.</p>
          </div>
          <FileText className="text-gray-300" size={24} />
        </div>

        {proposals.length === 0 ? (
          <div className="px-6 py-14 text-center text-gray-500">
            Belum ada proposal yang menggunakan RKAM ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Proposal</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Pengusul</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-500">Nominal Pengajuan</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Status Proposal</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Status Pembayaran</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Tanggal</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {proposals.map((proposal) => {
                  const proposalStatus = getProposalStatusConfig(proposal.status);
                  const payment = getPaymentByProposalId(proposal.id);

                  return (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{proposal.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{proposal.description || 'Tanpa deskripsi tambahan.'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {proposal.user?.full_name || proposal.user?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatIDR(parseAmountValue(proposal.jumlah_pengajuan))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${proposalStatus.className}`}>
                          {proposalStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {payment
                          ? getPaymentStatusLabel(payment.status)
                          : (proposal.status === 'completed' ? 'Sudah Terbayar' : 'Belum Diproses')}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(
                          proposal.completed_at
                          || proposal.final_approved_at
                          || proposal.approved_at
                          || proposal.submitted_at
                          || proposal.created_at,
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/proposals/${proposal.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-100 bg-white p-2 text-blue-600 shadow-sm hover:bg-blue-50"
                          title="Buka detail proposal"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RKAMDetail;
