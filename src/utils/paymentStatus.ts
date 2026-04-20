import type { Payment } from '../services/api';

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Sudah Terbayar',
  failed: 'Gagal',
  rejected: 'Ditolak',
};

export const getPaymentStatusLabel = (status?: Payment['status'] | string | null) =>
  PAYMENT_STATUS_LABELS[status || ''] || status || '-';

export const isPaymentCompleted = (payment?: Payment | null) => payment?.status === 'completed';
