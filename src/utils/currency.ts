export const parseAmountValue = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value || '')
    .replace(/rp/gi, '')
    .replace(/\s+/g, '')
    .trim();

  if (!raw) {
    return 0;
  }

  if (raw.includes('.') && raw.includes(',')) {
    const lastDot = raw.lastIndexOf('.');
    const lastComma = raw.lastIndexOf(',');

    if (lastComma > lastDot) {
      return Number(raw.replace(/\./g, '').replace(',', '.')) || 0;
    }

    return Number(raw.replace(/,/g, '')) || 0;
  }

  if (raw.includes('.')) {
    const parts = raw.split('.');

    if (parts.length === 2 && parts[1].length <= 2) {
      return Number(raw) || 0;
    }

    return Number(parts.join('')) || 0;
  }

  if (raw.includes(',')) {
    const parts = raw.split(',');

    if (parts.length === 2 && parts[1].length <= 2) {
      return Number(`${parts[0]}.${parts[1]}`) || 0;
    }

    return Number(parts.join('')) || 0;
  }

  return Number(raw.replace(/[^\d-]/g, '')) || 0;
};

export const formatAmountNumber = (value: string | number | null | undefined): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseAmountValue(value));
};

export const formatRupiah = (value: string | number | null | undefined): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseAmountValue(value));
};
