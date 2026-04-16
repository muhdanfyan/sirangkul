import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, Edit2, Trash2, AlertCircle, 
  Users, Shield, Mail, Calendar, Filter, 
  ArrowUpDown, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, X as XIcon,
  CheckCircle, XCircle
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { apiService, User, PaginatedResponse } from '../services/api';

const UserManagement: React.FC = () => {
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
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
    key: 'full_name',
    direction: 'asc'
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    status: 'Active',
    password: '',
  });

  // Other States
  const [toast, setToast] = useState<{ type: 'success'|'error'|'info'|'warning'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch Paginated Users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsers({
        page: currentPage,
        per_page: perPage,
        role: selectedRole,
        search: searchTerm,
        sort_by: sortConfig.key,
        order: sortConfig.direction
      });

      if ('data' in response && 'current_page' in response) {
        // Paginated Response
        const paginated = response as PaginatedResponse<User>;
        setUsers(paginated.data);
        setPaginationData({
          total: paginated.total,
          from: paginated.from,
          to: paginated.to,
          last_page: paginated.last_page
        });
      } else {
        // Array Response (Fallback or no_paginate)
        const userList = response as User[];
        setUsers(userList);
        setPaginationData({
          total: userList.length,
          from: 1,
          to: userList.length,
          last_page: 1
        });
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setToast({ type: 'error', message: 'Gagal memuat data pengguna' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, selectedRole, searchTerm, sortConfig]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // CRUD Handlers
  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status || 'Active',
        password: '', // Password empty when editing unless changing
      });
    } else {
      setEditingId(null);
      setFormData({
        full_name: '',
        email: '',
        role: '',
        status: 'Active',
        password: '',
      });
    }
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiService.updateUser(editingId, formData);
        setToast({ type: 'success', message: 'User berhasil diperbarui' });
      } else {
        await apiService.addUser(formData);
        setToast({ type: 'success', message: 'User berhasil ditambahkan' });
      }
      setShowFormModal(false);
      fetchUsers();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menyimpan user' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiService.delUser(confirmDelete);
      setToast({ type: 'success', message: 'User berhasil dihapus' });
      fetchUsers();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal menghapus user' });
    }
    setConfirmDelete(null);
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'administrator': 'border-red-200 text-red-600 bg-red-50',
      'pengusul': 'border-blue-200 text-blue-600 bg-blue-50',
      'verifikator': 'border-green-200 text-green-600 bg-green-50',
      'kepala_madrasah': 'border-purple-200 text-purple-600 bg-purple-50',
      'bendahara': 'border-yellow-200 text-yellow-600 bg-yellow-50',
      'komite_madrasah': 'border-gray-200 text-gray-600 bg-gray-50'
    };
    return colors[role.toLowerCase()] || 'border-gray-200 text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen User</h1>
          <p className="text-gray-500 mt-0.5">Kelola akses, peran, dan identitas pengguna sistem SiRangkul.</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari user (nama, email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Peran</option>
              <option value="administrator">Administrator</option>
              <option value="pengusul">Pengusul</option>
              <option value="verifikator">Verifikator</option>
              <option value="kepala_madrasah">Kepala Madrasah</option>
              <option value="bendahara">Bendahara</option>
              <option value="komite_madrasah">Komite Madrasah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center">Nama Lengkap <SortIcon column="full_name" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('email')}>
                  <div className="flex items-center">Email <SortIcon column="email" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('role')}>
                  <div className="flex items-center">Peran <SortIcon column="role" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center">Status <SortIcon column="status" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center justify-end">Dibuat <SortIcon column="created_at" /></div>
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">User tidak ditemukan.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 leading-tight">{user.full_name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{user.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} className="opacity-40" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleColor(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.status === 'Active' ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle size={14} />
                            <span className="font-bold text-xs">Aktif</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600">
                            <XCircle size={14} />
                            <span className="font-bold text-xs">Non-Aktif</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-gray-900 font-medium">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenForm(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
                          disabled={user.email === 'superadmin@sirangkul.sch.id'}
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
            <span className="text-xs text-gray-500 font-medium tracking-tight">
              Menampilkan {paginationData.from}-{paginationData.to} dari {paginationData.total}
            </span>
            <select 
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(paginationData.last_page, 5) }).map((_, i) => {
                const pageNum = i + 1;
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
              {paginationData.last_page > 5 && <span className="text-gray-400 px-1 italic">...</span>}
            </div>
            <button 
              disabled={currentPage === paginationData.last_page}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* User Add/Edit Modal */}
      {showFormModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Identitas User' : 'Tambah User Baru'}</h2>
                  <p className="text-xs text-gray-400">Pastikan data yang dimasukkan sudah benar.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFormModal(false)} 
                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-full transition-all"
              >
                <XIcon size={20} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-semibold"
                    placeholder="Contoh: Ahmad Fauzan"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="user@sirangkul.sch.id"
                    />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Peran / Role</label>
                     <select
                       required
                       value={formData.role}
                       onChange={e => setFormData({ ...formData, role: e.target.value })}
                       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none appearance-none transition-all"
                     >
                       <option value="">Pilih Role</option>
                       <option value="administrator">Administrator</option>
                       <option value="pengusul">Pengusul</option>
                       <option value="verifikator">Verifikator</option>
                       <option value="kepala_madrasah">Kepala Madrasah</option>
                       <option value="bendahara">Bendahara</option>
                       <option value="komite_madrasah">Komite Madrasah</option>
                     </select>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status Akun</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${formData.status === 'Active' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}>
                         <input 
                           type="radio" 
                           name="status" 
                           className="hidden" 
                           checked={formData.status === 'Active'} 
                           onChange={() => setFormData({...formData, status: 'Active'})} 
                         />
                         <CheckCircle size={20} />
                         Aktif
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 border-2 rounded-xl cursor-pointer transition-all ${formData.status === 'Inactive' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}>
                         <input 
                           type="radio" 
                           name="status" 
                           className="hidden" 
                           checked={formData.status === 'Inactive'} 
                           onChange={() => setFormData({...formData, status: 'Inactive'})} 
                         />
                         <XCircle size={20} />
                         Non-Aktif
                      </label>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Password {editingId && <span className="text-[10px] lowercase font-normal italic">(Kosongkan jika tidak ingin ganti)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="Min. 8 karakter"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98]"
                >
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan User'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      }

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Hapus Pengguna"
        message="Menghapus pengguna akan memutus semua akses mereka ke sistem. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UserManagement;