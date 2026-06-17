import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Edit2, Trash2, Printer, Settings, ChevronLeft, 
  ChevronRight, Calendar, Filter, ArrowUpDown, ChevronUp, ChevronDown, Eye, X as XIcon
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { apiService, RKAM, Category } from '../services/api';
import CategoryManagementModal from '../components/CategoryManagementModal';
import RKAMPrintTemplate from './RKAMPrintTemplate';
import { applyCompletedPaymentUsageToRKAM, resolveBudgetDateFilter, type BudgetTimeframe } from '../utils/rkamBudget';
import { useAuth } from '../contexts/AuthContext';

const OFFICIAL_RKAM_BIDANG_NAMES = [
  'HUMAS',
  'Pendidikan',
  'Sarana dan Prasarana',
  'Sekretariat Komite',
];

const DEFAULT_UNITS = ['Tahun', 'Bulan', 'Paket', 'Kegiatan', 'Unit', 'Orang', 'Siswa'];
const INVALID_UNIT_OPTION_NAMES = new Set(['volume', 'sarana', 'qr-botanica']);
const SHORT_BIDANG_LABELS: Record<string, string> = {
  'Sarana dan Prasarana': 'SARPRA',
  'Sekretariat Komite': 'SEKKOM',
};
const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

const RKAMManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageRKAM = user?.role === 'Administrator' || user?.role === 'Bendahara';
  // Data States
  const [rkamItems, setRkamItems] = useState<RKAM[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    from: 0,
    to: 0,
    last_page: 1
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });

  // Filter States
  const [timeframe, setTimeframe] = useState<BudgetTimeframe>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bidang_id: '',
    item_name: '',
    volume: '',
    satuan: '',
    unit_price: '',
    dana_bos: '',
    dana_komite: '',
    tahun_anggaran: new Date().getFullYear(),
    deskripsi: '',
  });

  // Other States
  const [toast, setToast] = useState<{ type: 'success'|'error'|'info'|'warning'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [fullDataForPrint, setFullDataForPrint] = useState<RKAM[]>([]);
  const [summary, setSummary] = useState<{ totalBudget: number; totalDanaBos: number; totalDanaKomite: number } | null>(null);

  // Auto-calculated pagu in form
  const computedPagu = useMemo(() => {
    return Number(formData.volume || 0) * Number(formData.unit_price || 0);
  }, [formData.volume, formData.unit_price]);

  const normalizeText = (value?: string | null) => (value || '').trim().toLowerCase();
  const getCurrencyDigits = (value: string | number | null | undefined) => {
    if (typeof value === 'number') {
      return String(Math.trunc(value));
    }

    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
      return '';
    }

    if (/^\d+\.\d{1,2}$/.test(rawValue)) {
      return rawValue.split('.')[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    }

    return rawValue.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  };
  const formatCurrencyInput = (value: string | number | null | undefined) => {
    const digits = getCurrencyDigits(value);
    return digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '';
  };
  const isOfficialBidangName = (value?: string | null) => OFFICIAL_RKAM_BIDANG_NAMES.includes((value || '').trim());
  const getBidangName = (item: RKAM) => (item.bidangRef?.name || item.bidang || item.category?.name || item.kategori || '').trim();
  const getTableBidangLabel = (item: RKAM) => {
    const bidangName = getBidangName(item);
    return SHORT_BIDANG_LABELS[bidangName] || bidangName;
  };

  const unitOptions = useMemo(() => {
    const mergedUnits = [...DEFAULT_UNITS, ...units]
      .map((unit) => (unit || '').trim())
      .filter((unit) => unit && !/^\d+([.,]\d+)?$/.test(unit) && !INVALID_UNIT_OPTION_NAMES.has(normalizeText(unit)));

    return Array.from(new Set(mergedUnits)).sort((left, right) => left.localeCompare(right));
  }, [units]);

  const categoryFilterOptions = useMemo(() => {
    const optionsMap = new Map<string, { value: string; label: string }>();

    categories.forEach((category) => {
      const label = category.name?.trim();
      if (!label || !isOfficialBidangName(label)) {
        return;
      }

      const normalizedLabel = normalizeText(label);
      optionsMap.set(normalizedLabel, {
        value: category.id,
        label,
      });
    });

    rkamItems.forEach((item) => {
      const label = (item.bidangRef?.name || item.bidang || item.category?.name || item.kategori || '').trim();
      if (!label || !isOfficialBidangName(label)) {
        return;
      }

      const normalizedLabel = normalizeText(label);
      if (!optionsMap.has(normalizedLabel)) {
        optionsMap.set(normalizedLabel, {
          value: `legacy:${label}`,
          label,
        });
      }
    });

    return Array.from(optionsMap.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [categories, rkamItems]);

  // Fetch Options (Categories & Units)
  const fetchOptions = useCallback(async () => {
    try {
      const [options, categoryList] = await Promise.allSettled([
        apiService.getRKAMOptions(),
        apiService.getAllCategories(),
      ]);

      const optionCategories = options.status === 'fulfilled' ? options.value.bidangs : [];
      const optionUnits = options.status === 'fulfilled' ? options.value.units : [];
      const directCategories = categoryList.status === 'fulfilled' ? categoryList.value : [];

      const mergedCategories = [...optionCategories, ...directCategories].reduce<Category[]>((accumulator, category) => {
        if (!accumulator.some((item) => item.id === category.id)) {
          accumulator.push(category);
        }
        return accumulator;
      }, [])
        .filter((category) => isOfficialBidangName(category.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategories(mergedCategories);
      setUnits(optionUnits);
    } catch (err) {
      console.error('Failed to fetch options:', err);
      setToast({ type: 'error', message: 'Gagal memuat opsi bidang RKAM.' });
    }
  }, []);

  // Fetch Paginated RKAM Data
  const fetchRKAMData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [rkamResult, paymentResult] = await Promise.allSettled([
        apiService.getAllRKAM({
          tahun_anggaran: timeframe === 'year' ? new Date().getFullYear() : undefined,
          start_date: dateRange.start,
          end_date: dateRange.end,
          preset: timeframe !== 'custom' ? timeframe : undefined,
          no_paginate: true,
        }),
        apiService.getAllPayments(),
      ]);

      if (rkamResult.status !== 'fulfilled') {
        throw rkamResult.reason;
      }

      const rawRkamResponse = rkamResult.value;
      const rawRkamPayload = Array.isArray(rawRkamResponse) ? rawRkamResponse : rawRkamResponse.data;
      const rawRkams = Array.isArray(rawRkamPayload) ? rawRkamPayload : rawRkamPayload.data;
      const rawSummary = Array.isArray(rawRkamResponse) ? null : rawRkamResponse.summary;

      if (paymentResult.status !== 'fulfilled') {
        console.warn('Failed to sync completed payment usage for RKAM page:', paymentResult.reason);
        setRkamItems(rawRkams);
        setSummary(rawSummary);
        return;
      }

      const paymentDateFilter = resolveBudgetDateFilter(timeframe, {
        start: dateRange.start,
        end: dateRange.end,
      });

      setRkamItems(applyCompletedPaymentUsageToRKAM(rawRkams, paymentResult.value, paymentDateFilter));
      setSummary(rawSummary);
    } catch (err) {
      console.error('Failed to fetch RKAM:', err);
      setToast({ type: 'error', message: 'Gagal memuat data RKAM' });
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchRKAMData();
  }, [fetchRKAMData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchTerm, timeframe, dateRange.start, dateRange.end, perPage]);

  const filteredRkamItems = useMemo(() => {
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    const selectedLegacyCategoryName = selectedCategoryId.startsWith('legacy:')
      ? selectedCategoryId.replace(/^legacy:/, '')
      : undefined;

    const categoryFiltered = rkamItems.filter((item) => {
      if (selectedCategoryId === 'all') {
        return true;
      }

      const itemCategoryId = item.bidang_id || item.category?.id || item.category_id;
      if (itemCategoryId && itemCategoryId === selectedCategoryId) {
        return true;
      }

      const selectedName = normalizeText(selectedCategory?.name || selectedLegacyCategoryName);
      const itemCategoryName = normalizeText(item.bidangRef?.name || item.bidang || item.category?.name || item.kategori);

      return Boolean(selectedName) && itemCategoryName === selectedName;
    });

    const searchFiltered = categoryFiltered.filter((item) => {
      if (!searchTerm.trim()) {
        return true;
      }

      const keyword = normalizeText(searchTerm);
      return [
        item.item_name,
        item.bidang,
        item.kategori,
        item.bidangRef?.name,
        item.category?.name,
        item.deskripsi,
      ].some((value) => normalizeText(value).includes(keyword));
    });

    const getSortableValue = (item: RKAM) => {
      switch (sortConfig.key) {
        case 'kategori':
          return normalizeText(item.bidangRef?.name || item.bidang || item.category?.name || item.kategori);
        case 'item_name':
          return normalizeText(item.item_name);
        case 'pagu':
          return Number(item.pagu);
        case 'realization':
          return Number(item.terpakai_filtered ?? item.terpakai);
        case 'created_at':
          return new Date(item.created_at || 0).getTime();
        default:
          return normalizeText(String((item as unknown as Record<string, unknown>)[sortConfig.key] || ''));
      }
    };

    return [...searchFiltered].sort((left, right) => {
      const leftValue = getSortableValue(left);
      const rightValue = getSortableValue(right);

      if (leftValue < rightValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [categories, rkamItems, searchTerm, selectedCategoryId, sortConfig]);

  const computedPagination = useMemo(() => {
    const total = filteredRkamItems.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const safeCurrentPage = Math.min(currentPage, lastPage);
    const from = total === 0 ? 0 : (safeCurrentPage - 1) * perPage + 1;
    const to = total === 0 ? 0 : Math.min(safeCurrentPage * perPage, total);

    return {
      total,
      from,
      to,
      last_page: lastPage,
      safeCurrentPage,
    };
  }, [currentPage, filteredRkamItems.length, perPage]);

  const paginatedRkamItems = useMemo(() => {
    const startIndex = (computedPagination.safeCurrentPage - 1) * perPage;
    return filteredRkamItems.slice(startIndex, startIndex + perPage);
  }, [computedPagination.safeCurrentPage, filteredRkamItems, perPage]);

  useEffect(() => {
    setPaginationData({
      total: computedPagination.total,
      from: computedPagination.from,
      to: computedPagination.to,
      last_page: computedPagination.last_page,
    });

    if (currentPage !== computedPagination.safeCurrentPage) {
      setCurrentPage(computedPagination.safeCurrentPage);
    }
  }, [computedPagination, currentPage]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="ml-1 text-gray-300" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="ml-1 text-blue-600" /> : 
      <ChevronDown size={14} className="ml-1 text-blue-600" />;
  };

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // CRUD Handlers
  const handleOpenForm = (item?: RKAM) => {
    if (!canManageRKAM) {
      setToast({ type: 'warning', message: 'Akses tambah/edit RKAM hanya untuk Administrator dan Bendahara.' });
      return;
    }

    if (item) {
      setEditingId(item.id);
      setFormData({
        bidang_id: item.bidang_id || item.category_id || '',
        item_name: item.item_name,
        volume: String(item.volume),
        satuan: item.satuan,
        unit_price: getCurrencyDigits(item.unit_price),
        dana_bos: getCurrencyDigits(item.dana_bos),
        dana_komite: getCurrencyDigits(item.dana_komite),
        tahun_anggaran: item.tahun_anggaran,
        deskripsi: item.deskripsi || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        bidang_id: '',
        item_name: '',
        volume: '',
        satuan: '',
        unit_price: '',
        dana_bos: '',
        dana_komite: '',
        tahun_anggaran: new Date().getFullYear(),
        deskripsi: '',
      });
    }
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        volume: Number(formData.volume),
        unit_price: Number(getCurrencyDigits(formData.unit_price)),
        dana_bos: Number(getCurrencyDigits(formData.dana_bos) || 0),
        dana_komite: Number(getCurrencyDigits(formData.dana_komite) || 0),
      };

      if (editingId) {
        await apiService.updateRKAM(editingId, payload);
        setToast({ type: 'success', message: 'RKAM berhasil diperbarui' });
      } else {
        await apiService.createRKAM(payload);
        setToast({ type: 'success', message: 'RKAM berhasil ditambahkan' });
      }
      setShowFormModal(false);
      fetchRKAMData();
    } catch (err: unknown) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Gagal menyimpan RKAM') });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiService.deleteRKAM(confirmDelete);
      setToast({ type: 'success', message: 'RKAM berhasil dihapus' });
      fetchRKAMData();
    } catch (err: unknown) {
      setToast({ type: 'error', message: getErrorMessage(err, 'Gagal menghapus RKAM') });
    }
    setConfirmDelete(null);
  };

  const handleOpenDetail = (item: RKAM) => {
    navigate(`/rkam/${item.id}`);
  };

  const handlePrint = useCallback(async () => {
    try {
      setIsPreparingPrint(true);
      setToast({ type: 'info', message: 'Menyiapkan dokumen cetak...' });

      setFullDataForPrint(filteredRkamItems);
      setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
      }, 800);
    } catch (err: unknown) {
      console.error('Print failed:', err);
      setToast({ type: 'error', message: getErrorMessage(err, 'Gagal menyiapkan cetakan.') });
      setIsPreparingPrint(false);
    }
  }, [filteredRkamItems]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Helper for progress bar
  const getProgressColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Anggaran (RKAM)</h1>
          <p className="text-gray-500 mt-0.5">Pantau dan kelola distribusi anggaran madrasah secara akurat.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageRKAM && (
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              <Settings size={18} />
              Kelola Bidang
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            <Printer size={18} />
            Cetak
          </button>
          {canManageRKAM && (
            <button 
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
            >
              <Plus size={18} />
              Tambah RKAM
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Pagu Terdaftar</p>
          <p className="text-2xl font-black text-gray-900">{formatIDR(summary?.totalBudget || 0)}</p>
        </div>
        <div className="bg-green-50/30 p-5 rounded-xl border border-green-100 shadow-sm">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Alokasi Dana BOS</p>
          <p className="text-2xl font-black text-green-700">{formatIDR(summary?.totalDanaBos || 0)}</p>
        </div>
        <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100 shadow-sm">
          <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Alokasi Dana Komite</p>
          <p className="text-2xl font-black text-purple-700">{formatIDR(summary?.totalDanaKomite || 0)}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Bidang</option>
              {categoryFilterOptions.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>{categoryOption.label}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Preset */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as BudgetTimeframe)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Seluruh Waktu</option>
              <option value="year">Tahun Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="week">Pekan Ini</option>
              <option value="custom">Rentang Kustom</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm" 
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 w-32 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('kategori')}>
                  <div className="flex items-center">Bidang <SortIcon column="kategori" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('item_name')}>
                  <div className="flex items-center">Uraian Anggaran <SortIcon column="item_name" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pagu')}>
                  <div className="flex items-center justify-end">Pagu (Total) <SortIcon column="pagu" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('realization')}>
                  <div className="flex items-center justify-end">Terpakai <SortIcon column="realization" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Sisa</th>
                <th className="px-6 py-4 font-semibold text-gray-700 w-1/6">Penyerapan</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                    ))}
                  </tr>
                ))
              ) : filteredRkamItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">Data tidak ditemukan.</td>
                </tr>
              ) : (
                paginatedRkamItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span 
                        className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                        style={{ 
                          borderColor: item.bidangRef?.color || item.category?.color || '#e5e7eb',
                          color: item.bidangRef?.color || item.category?.color || '#6b7280',
                          backgroundColor: `${item.bidangRef?.color || item.category?.color || '#6b7280'}10`
                        }}
                      >
                        {getTableBidangLabel(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.item_name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 uppercase">{item.volume} {item.satuan} @ {formatIDR(item.unit_price)}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {formatIDR(item.pagu)}
                    </td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">
                      {formatIDR(item.terpakai_filtered ?? item.terpakai)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {formatIDR(item.sisa_filtered ?? item.sisa)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${getProgressColor(item.persentase_filtered ?? item.persentase)}`}
                            style={{ width: `${Math.min(item.persentase_filtered ?? item.persentase, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">{(item.persentase_filtered ?? item.persentase).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
                          title="Detail RKAM"
                        >
                          <Eye size={14} />
                        </button>
                        {canManageRKAM && (
                          <>
                            <button 
                              onClick={() => handleOpenForm(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit RKAM"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setConfirmDelete(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus RKAM"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-medium">
              Menampilkan {paginationData.from}-{paginationData.to} dari {paginationData.total}
            </span>
            <select 
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={100}>100 Baris</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(paginationData.last_page, 5) }).map((_, i) => {
                const pageNum = i + 1; // Simplified for now, could be improved with sliding window
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {paginationData.last_page > 5 && <span className="text-gray-400 px-1">...</span>}
            </div>
            <button 
              disabled={currentPage === paginationData.last_page}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* RKAM Print View (Hidden unless printing) */}
      <RKAMPrintTemplate 
        data={fullDataForPrint.length > 0 ? fullDataForPrint : rkamItems} 
        tahun={new Date().getFullYear()} 
      />

      {/* Loading Overlay for Print */}
      {isPreparingPrint && createPortal(
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold">Menyiapkan Dokumen RKAM...</h2>
          <p className="opacity-70 mt-2">Seluruh data sedang dimuat untuk hasil cetal maksimal.</p>
        </div>, document.body
      )}

      {/* Category Management Modal */}
      {canManageRKAM && (
        <CategoryManagementModal 
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoriesChanged={fetchOptions}
        />
      )}

      {/* RKAM Add/Edit Modal */}
      {showFormModal && canManageRKAM && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Anggaran RKAM' : 'Tambah Anggaran Baru'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><XIcon size={24} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Item / Uraian</label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="Contoh: Belanja Alat Tulis Kantor"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bidang</label>
                  <select
                    required
                    value={formData.bidang_id}
                    onChange={e => setFormData({ ...formData, bidang_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Pilih Bidang</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.5fr)] gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Volume</label>
                    <input
                      type="number"
                      required
                      value={formData.volume}
                      onChange={e => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                      placeholder="e.g. 1"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">Jumlah kebutuhan item RKAM.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Satuan Volume</label>
                    <input
                      type="text"
                      required
                      list="unitsDropdown"
                      value={formData.satuan}
                      onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                      placeholder="Contoh: Bulan"
                    />
                    <datalist id="unitsDropdown">
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-[11px] text-gray-400">Contoh: Bulan, Tahun, Paket, Orang.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatCurrencyInput(formData.unit_price)}
                    onChange={e => setFormData({ ...formData, unit_price: getCurrencyDigits(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                    placeholder="Contoh: 1.000.000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Pagu (Auto)</label>
                  <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg font-bold text-blue-700">
                    {formatIDR(computedPagu)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dana BOS (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(formData.dana_bos)}
                    onChange={e => setFormData({ ...formData, dana_bos: getCurrencyDigits(e.target.value) })}
                    className="w-full px-4 py-2 bg-green-50 border border-green-100 rounded-lg outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dana Komite (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrencyInput(formData.dana_komite)}
                    onChange={e => setFormData({ ...formData, dana_komite: getCurrencyDigits(e.target.value) })}
                    className="w-full px-4 py-2 bg-purple-50 border border-purple-100 rounded-lg outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Posting Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      }

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Hapus RKAM"
        message="Data yang dihapus tidak dapat dikembalikan. Lanjutkan?"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};


export default RKAMManagement;
