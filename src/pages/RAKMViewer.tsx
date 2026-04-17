import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, Download, FileText, Search, Filter, 
  ArrowUpDown, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, X as XIcon,
  CheckCircle, Landmark, Calendar,
  ExternalLink, FileSpreadsheet
} from 'lucide-react';
import { apiService, RKAM, PaginatedResponse, Category } from '../services/api';

const RAKMViewer: React.FC = () => {
  // Data States
  const [rkamData, setRkamData] = useState<RKAM[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<{ totalBudget: number; totalDanaBos: number; totalDanaKomite: number } | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
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
    key: 'item_name',
    direction: 'asc'
  });

  // Static Background Files
  const rakmFiles = [
    { name: 'RKAM tahun 2026.pdf', path: '/file/RKAM tahun 2026.pdf', type: 'pdf' },
    { name: 'FIX RKAM INFAK - Revisi TA 2025.pdf', path: '/file/FIX RKAM INFAK - Revisi TA 2025.pdf', type: 'pdf' },
    { name: 'RKAM PERUBAHAN-REVISI TA 2025 - 17092025.xls', path: '/file/RKAM PERUBAHAN-REVISI TA 2025 - 17092025.xls', type: 'excel' },
    { name: 'SOP PELATIHAN SiRANGKUL.pdf', path: '/file/SOP PELATIHAN SiRANGKUL.pdf', type: 'pdf' },
  ];

  // Fetch Public RKAM Data
  const fetchPublicData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch data using the NEW public endpoint
        const response = await apiService.getPublicRKAM({
          page: currentPage,
          per_page: perPage,
          search: searchTerm,
          category_id: selectedCategoryId,
          sort_by: sortConfig.key,
          order: sortConfig.direction
        });
  
        setRkamData(Array.isArray(response.data) ? response.data : (response.data?.data || []));
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
      console.error('Failed to fetch public RKAM data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, searchTerm, selectedCategoryId, sortConfig]);

  // Fetch Categories for Filter
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await apiService.getPublicRKAMOptions();
        setCategories(response.categories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
               <img src="/logo-sirangkul.png" alt="SiRangkul Logo" className="h-8 w-8 brightness-0 invert" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Portal Transparansi RKAM</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">SiRangkul System v1.0</p>
            </div>
          </div>
          <a href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-blue-100">
            Login Sistem
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Statistics or Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
              <div className="relative z-10">
                <Landmark className="h-10 w-10 text-blue-200 mb-4" />
                <h2 className="text-2xl font-bold">Transparansi Anggaran 2026</h2>
                <p className="text-blue-100 mt-2 text-sm max-w-sm">SiRangkul berkomitmen menyederhanakan pelaporan dan transparansi anggaran madrasah untuk seluruh stakeholder.</p>
              </div>
              <div className="absolute -right-8 -bottom-8 bg-white opacity-5 w-48 h-48 rounded-full"></div>
           </div>
           
           <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                 <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest">Update Terakhir</h3>
                 <Calendar className="text-gray-300 h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-gray-900 tracking-tight">{paginationData.total}</p>
                <p className="text-sm text-gray-400 font-medium">Item anggaran yang terpublikasi</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                 <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live Database Sync Active</span>
              </div>
           </div>
        </div>

        {/* Database Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="text-blue-600" size={20} />
                Detail Anggaran Digital
             </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari uraian anggaran..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="w-full md:w-64 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAFC] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Kategori</th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('item_name')}>
                       <div className="flex items-center">Uraian Kegitan <SortIcon column="item_name" /></div>
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('pagu')}>
                       <div className="flex items-center justify-end">Pagu <SortIcon column="pagu" /></div>
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('realization')}>
                       <div className="flex items-center justify-end">Realisasi <SortIcon column="realization" /></div>
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array(5).fill(0).map((_, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-50 rounded"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : rkamData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Data tidak ditemukan.</td>
                    </tr>
                  ) : (
                    rkamData.map(item => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                           <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                              {item.category?.name || 'Umum'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{item.item_name}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">
                           {formatCurrency(item.pagu)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-blue-600 bg-blue-50/30">
                           {formatCurrency(item.terpakai_filtered || 0)}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center justify-center">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full rounded-full ${item.persentase_filtered > 90 ? 'bg-red-500' : 'bg-green-500'}`} 
                                   style={{ width: `${Math.min(item.persentase_filtered, 100)}%` }}
                                 ></div>
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Halaman {currentPage} dari {paginationData.last_page}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-20 transition-all shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  disabled={currentPage === paginationData.last_page}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-20 transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Files Section */}
        <div className="pt-8 border-t border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
             <FileText className="text-green-600" size={20} />
             Arsip Dokumen Pendukung
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {rakmFiles.map((file, i) => (
               <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                     {file.type === 'pdf' ? (
                       <FileText className="text-red-500 h-8 w-8" />
                     ) : (
                       <FileSpreadsheet className="text-green-600 h-8 w-8" />
                     )}
                     <div className="flex gap-1.5">
                        <a href={file.path} target="_blank" rel="noopener" className="p-1.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                           <Eye size={16} />
                        </a>
                        <a href={file.path} download className="p-1.5 bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                           <Download size={16} />
                        </a>
                     </div>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{file.name}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Dokumen Resmi Madrasah</p>
               </div>
             ))}
          </div>
        </div>

      </main>

      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <img src="/logo-sirangkul.png" alt="Logo" className="h-8 w-8 mx-auto grayscale opacity-50 mb-4" />
           <p className="text-sm text-gray-500">© 2026 MAN 2 Kota Makassar - SiRangkul Transparent System</p>
           <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-[4px]">Verified Infrastructure</div>
        </div>
      </footer>
    </div>
  );
};

export default RAKMViewer;