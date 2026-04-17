import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, Edit2, Trash2, AlertCircle, TrendingUp, 
  DollarSign, Activity, Printer, Settings, ChevronLeft, 
  ChevronRight, Calendar, Filter, ArrowUpDown, ChevronUp, ChevronDown, X as XIcon
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { apiService, RKAM, Category } from '../services/api';
import CategoryManagementModal from '../components/CategoryManagementModal';
import RKAMPrintTemplate from './RKAMPrintTemplate';

const RKAMManagement: React.FC = () => {
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
  const [timeframe, setTimeframe] = useState<'all' | 'year' | 'month' | 'week' | 'custom'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
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

  // Auto-calculated pagu in form
  const computedPagu = useMemo(() => {
    return Number(formData.volume || 0) * Number(formData.unit_price || 0);
  }, [formData.volume, formData.unit_price]);

  // Fetch Options (Categories & Units)
  const fetchOptions = useCallback(async () => {
    try {
      const { categories, units } = await apiService.getRKAMOptions();
      setCategories(categories);
      setUnits(units);
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  }, []);

  // Fetch Paginated RKAM Data
  const fetchRKAMData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Prepare timeframe filters
      let start_date = dateRange.start;
      let end_date = dateRange.end;
      let preset = timeframe;

      const response = await apiService.getAllRKAM({
        page: currentPage,
        per_page: perPage,
        category_id: selectedCategoryId,
        search: searchTerm,
        tahun_anggaran: timeframe === 'year' ? new Date().getFullYear() : undefined,
        start_date,
        end_date,
        preset: timeframe !== 'custom' ? timeframe : undefined,
        sort_by: sortConfig.key,
        order: sortConfig.direction
      });

      setRkamItems(Array.isArray(response.data) ? response.data : (response.data?.data || []));
      setSummary(response.summary || null);
      if (!Array.isArray(response.data)) {
        setPaginationData({
          total: response.data.total,
          from: response.data.from,
          to: response.data.to,
          last_page: response.data.last_page
        });
      }
    } catch (err) {
      console.error('Failed to fetch RKAM:', err);
      setToast({ type: 'error', message: 'Gagal memuat data RKAM' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, selectedCategoryId, searchTerm, timeframe, dateRange, sortConfig]);

  useEffect(() => {
    fetchRKAMData();
  }, [fetchRKAMData]);

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
    if (item) {
      setEditingId(item.id);
      setFormData({
        category_id: item.category_id,
        item_name: item.item_name,
        volume: String(item.volume),
        satuan: item.satuan,
        unit_price: String(item.unit_price),
        dana_bos: String(item.dana_bos),
        dana_komite: String(item.dana_komite),
        tahun_anggaran: item.tahun_anggaran,
        deskripsi: item.deskripsi || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        category_id: '',
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
        unit_price: Number(formData.unit_price),
        dana_bos: Number(formData.dana_bos || 0),
        dana_komite: Number(formData.dana_komite || 0),
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
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menyimpan RKAM' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiService.deleteRKAM(confirmDelete);
      setToast({ type: 'success', message: 'RKAM berhasil dihapus' });
      fetchRKAMData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menghapus RKAM' });
    }
    setConfirmDelete(null);
  };

  const handlePrint = async () => {
    try {
      setIsPreparingPrint(true);
      setToast({ type: 'info', message: 'Menyiapkan dokumen cetak...' });
      
      const response = await apiService.getAllRKAM({
        category_id: selectedCategoryId,
        search: searchTerm,
        tahun_anggaran: timeframe === 'year' ? new Date().getFullYear() : undefined,
        start_date: dateRange.start,
        end_date: dateRange.end,
        preset: timeframe !== 'custom' ? timeframe : undefined,
        sort_by: sortConfig.key,
        order: sortConfig.direction,
        no_paginate: true
      });

      const actualData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      if (actualData.length > 0) {
        setFullDataForPrint(actualData);
        // Wait for state to update and template to render
        setTimeout(() => {
          window.print();
          setIsPreparingPrint(false);
        }, 800);
      } else {
        throw new Error('Gagal mengambil data lengkap untuk pencetakan.');
      }
    } catch (err: any) {
      console.error('Print failed:', err);
      setToast({ type: 'error', message: err.message || 'Gagal menyiapkan cetakan.' });
      setIsPreparingPrint(false);
    }
  };

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
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            <Settings size={18} />
            Kelola Kategori
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            <Printer size={18} />
            Cetak
          </button>
          <button 
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
          >
            <Plus size={18} />
            Tambah RKAM
          </button>
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
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Preset */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
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
                  <div className="flex items-center">Kategori <SortIcon column="kategori" /></div>
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
              ) : rkamItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">Data tidak ditemukan.</td>
                </tr>
              ) : (
                rkamItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span 
                        className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                        style={{ 
                          borderColor: item.category?.color || '#e5e7eb',
                          color: item.category?.color || '#6b7280',
                          backgroundColor: `${item.category?.color || '#6b7280'}10`
                        }}
                      >
                        {item.category?.name || item.kategori}
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
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenForm(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
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
      <CategoryManagementModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChanged={fetchOptions}
      />

      {/* RKAM Add/Edit Modal */}
      {showFormModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Anggaran RKAM' : 'Tambah Anggaran Baru'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><XIcon size={24} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Volume</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={formData.volume}
                      onChange={e => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                      placeholder="e.g. 1"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        list="unitsDropdown"
                        value={formData.satuan}
                        onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                        placeholder="Satuan"
                      />
                      <datalist id="unitsDropdown">
                        <option value="Tahun" />
                        <option value="Bulan" />
                        <option value="Paket" />
                        <option value="Orang" />
                        <option value="Lusin" />
                        <option value="Item" />
                      </datalist>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                    placeholder="e.g. 100000"
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
                    type="number"
                    value={formData.dana_bos}
                    onChange={e => setFormData({ ...formData, dana_bos: e.target.value })}
                    className="w-full px-4 py-2 bg-green-50 border border-green-100 rounded-lg outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dana Komite (Rp)</label>
                  <input
                    type="number"
                    value={formData.dana_komite}
                    onChange={e => setFormData({ ...formData, dana_komite: e.target.value })}
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