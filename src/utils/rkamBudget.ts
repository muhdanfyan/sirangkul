import type { Payment, RKAM } from '../services/api';
import { parseAmountValue } from './currency';

type BudgetDateFilter = {
  startDate?: string;
  endDate?: string;
};

export type BudgetTimeframe = 'all' | 'year' | 'month' | 'week' | 'custom';

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateBoundary = (value?: string, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}${endOfDay ? 'T23:59:59.999' : 'T00:00:00.000'}`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const isCompletedPaymentInRange = (payment: Payment, filter?: BudgetDateFilter) => {
  if (payment.status !== 'completed') {
    return false;
  }

  if (!filter?.startDate && !filter?.endDate) {
    return true;
  }

  if (!payment.completed_at) {
    return false;
  }

  const completedAt = new Date(payment.completed_at);
  if (Number.isNaN(completedAt.getTime())) {
    return false;
  }

  const startBoundary = normalizeDateBoundary(filter.startDate);
  if (startBoundary && completedAt < startBoundary) {
    return false;
  }

  const endBoundary = normalizeDateBoundary(filter.endDate, true);
  if (endBoundary && completedAt > endBoundary) {
    return false;
  }

  return true;
};

export const resolveBudgetDateFilter = (
  timeframe: BudgetTimeframe,
  customRange?: { start?: string; end?: string },
) => {
  const now = new Date();

  if (timeframe === 'year') {
    return {
      startDate: `${now.getFullYear()}-01-01`,
      endDate: `${now.getFullYear()}-12-31`,
    };
  }

  if (timeframe === 'month') {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
    };
  }

  if (timeframe === 'week') {
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + mondayOffset);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
    };
  }

  if (timeframe === 'custom') {
    return {
      startDate: customRange?.start || undefined,
      endDate: customRange?.end || undefined,
    };
  }

  return {};
};

export const applyCompletedPaymentUsageToRKAM = (
  rkams: RKAM[],
  payments: Payment[],
  filter?: BudgetDateFilter,
) => {
  const usageByRkam = new Map<string, number>();

  payments
    .filter((payment) => isCompletedPaymentInRange(payment, filter))
    .forEach((payment) => {
      const rkamId = payment.proposal?.rkam?.id || payment.proposal?.rkam_id;
      if (!rkamId) {
        return;
      }

      const currentUsage = usageByRkam.get(rkamId) || 0;
      usageByRkam.set(rkamId, currentUsage + parseAmountValue(payment.amount));
    });

  return rkams.map((rkam) => {
    const pagu = parseAmountValue(rkam.pagu);
    const terpakai = usageByRkam.get(rkam.id) || 0;
    const sisa = pagu - terpakai;
    const persentase = pagu > 0 ? (terpakai / pagu) * 100 : 0;

    return {
      ...rkam,
      terpakai,
      sisa,
      persentase,
      terpakai_filtered: terpakai,
      sisa_filtered: sisa,
      persentase_filtered: persentase,
    };
  });
};
