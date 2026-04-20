import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Filter,
  Mail,
  Plus,
  Search,
  Trash2,
  X as XIcon,
  XCircle,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { apiService, Bidang, PaginatedResponse, User } from '../services/api';

const ROLE_OPTIONS = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'pengusul', label: 'Pengusul' },
  { value: 'verifikator', label: 'Verifikator' },
  { value: 'komite_madrasah', label: 'Komite Madrasah' },
  { value: 'kepala_madrasah', label: 'Kepala Madrasah' },
  { value: 'bendahara', label: 'Bendahara' },
];

const requiresBidang = (role: string) => (
  ['pengusul', 'verifikator', 'komite_madrasah', 'kepala_madrasah'].includes(role)
);

const formatRole = (role: string) => (
  role.split('_').map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' ')
);

const getRoleTone = (role: string) => {
  const tones: Record<string, string> = {
    administrator: 'border-red-200 bg-red-50 text-red-700',
    pengusul: 'border-blue-200 bg-blue-50 text-blue-700',
    verifikator: 'border-green-200 bg-green-50 text-green-700',
    komite_madrasah: 'border-amber-200 bg-amber-50 text-amber-700',
    kepala_madrasah: 'border-purple-200 bg-purple-50 text-purple-700',
    bendahara: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return tones[role] || 'border-gray-200 bg-gray-50 text-gray-700';
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [bidangs, setBidangs] = useState<Bidang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBidangsLoading, setIsBidangsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedBidangId, setSelectedBidangId] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    from: 0,
    to: 0,
    last_page: 1,
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'full_name',
    direction: 'asc',
  });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    bidang_id: '',
    status: 'Active',
    password: '',
  });

  const fetchBidangs = useCallback(async () => {
    try {
      setIsBidangsLoading(true);
      const bidangResponse = await apiService.getAllBidangs();
      setBidangs(bidangResponse);
    } catch (error) {
      console.error('Failed to fetch bidangs:', error);
      setToast({ type: 'error', message: 'Gagal memuat daftar bidang.' });
    } finally {
      setIsBidangsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const usersResponse = await apiService.getUsers({
        page: currentPage,
        per_page: perPage,
        role: selectedRole,
        bidang_id: selectedBidangId,
        search: searchTerm,
        sort_by: sortConfig.key,
        order: sortConfig.direction,
      });

      if ('data' in usersResponse && 'current_page' in usersResponse) {
        const paginated = usersResponse as PaginatedResponse<User>;
        setUsers(paginated.data);
        setPaginationData({
          total: paginated.total,
          from: paginated.from,
          to: paginated.to,
          last_page: paginated.last_page,
        });
      } else {
        const data = usersResponse as User[];
        setUsers(data);
        setPaginationData({
          total: data.length,
          from: data.length ? 1 : 0,
          to: data.length,
          last_page: 1,
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({ type: 'error', message: 'Gagal memuat data pengguna.' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, searchTerm, selectedRole, selectedBidangId, sortConfig.direction, sortConfig.key]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchBidangs();
  }, [fetchBidangs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedBidangId, perPage]);

  useEffect(() => {
    if (showFormModal && bidangs.length === 0 && !isBidangsLoading) {
      fetchBidangs();
    }
  }, [bidangs.length, fetchBidangs, isBidangsLoading, showFormModal]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown size={14} className="ml-1 text-gray-300" />;
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className="ml-1 text-blue-600" />
      : <ChevronDown size={14} className="ml-1 text-blue-600" />;
  };

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        full_name: user.full_name || user.name || '',
        email: user.email,
        role: user.role,
        bidang_id: user.bidang_id || user.bidang?.id || '',
        status: user.status || 'Active',
        password: '',
      });
    } else {
      setEditingId(null);
      setFormData({
        full_name: '',
        email: '',
        role: '',
        bidang_id: '',
        status: 'Active',
        password: '',
      });
    }

    setShowFormModal(true);

    if (bidangs.length === 0 && !isBidangsLoading) {
      fetchBidangs();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (requiresBidang(formData.role) && !formData.bidang_id) {
      setToast({ type: 'error', message: 'Bidang wajib dipilih untuk role ini.' });
      return;
    }

    try {
      const payload = {
        ...formData,
        bidang_id: requiresBidang(formData.role) ? formData.bidang_id : null,
      };

      if (editingId) {
        await apiService.updateUser(editingId, payload);
        setToast({ type: 'success', message: 'User berhasil diperbarui.' });
      } else {
        await apiService.addUser(payload);
        setToast({ type: 'success', message: 'User berhasil ditambahkan.' });
      }

      setShowFormModal(false);
      await fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan user.';
      setToast({ type: 'error', message });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      await apiService.delUser(confirmDelete);
      setToast({ type: 'success', message: 'User berhasil dihapus.' });
      await fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus user.';
      setToast({ type: 'error', message });
    } finally {
      setConfirmDelete(null);
    }
  };

  const bidangOptions = useMemo(
    () => [...bidangs].sort((left, right) => left.name.localeCompare(right.name)),
    [bidangs],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="mt-1 text-gray-500">Kelola akun, role, dan bidang pengguna aplikasi.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari user, email, atau bidang..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={selectedBidangId}
              onChange={(event) => setSelectedBidangId(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Bidang</option>
              {bidangOptions.map((bidang) => (
                <option key={bidang.id} value={bidang.id}>{bidang.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="cursor-pointer px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center">Nama Lengkap <SortIcon column="full_name" /></div>
                </th>
                <th className="cursor-pointer px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('email')}>
                  <div className="flex items-center">Email <SortIcon column="email" /></div>
                </th>
                <th className="cursor-pointer px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('role')}>
                  <div className="flex items-center">Role <SortIcon column="role" /></div>
                </th>
                <th className="cursor-pointer px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('bidang_id')}>
                  <div className="flex items-center">Bidang <SortIcon column="bidang_id" /></div>
                </th>
                <th className="cursor-pointer px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('status')}>
                  <div className="flex items-center">Status <SortIcon column="status" /></div>
                </th>
                <th className="cursor-pointer px-6 py-4 text-right font-semibold text-gray-600 hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center justify-end">Dibuat <SortIcon column="created_at" /></div>
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, colIndex) => (
                      <td key={`col-${colIndex}`} className="px-6 py-4">
                        <div className="h-4 rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center italic text-gray-400">User tidak ditemukan.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{user.full_name || user.name || '-'}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">{user.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} className="opacity-40" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleTone(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.bidang?.name || (requiresBidang(user.role) ? '-' : 'Semua Bidang')}
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'Active' ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs font-bold">Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <XCircle size={14} />
                          <span className="text-xs font-bold">Non-Aktif</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenForm(user)}
                          className="rounded-lg border border-gray-100 bg-white p-1.5 text-blue-600 shadow-sm transition-colors hover:bg-blue-50"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          disabled={user.email === 'superadmin@sirangkul.sch.id' || user.email === 'admin@sirangkul.com'}
                          className="rounded-lg border border-gray-100 bg-white p-1.5 text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium tracking-tight text-gray-500">
              Menampilkan {paginationData.from}-{paginationData.to} dari {paginationData.total}
            </span>
            <select
              value={perPage}
              onChange={(event) => setPerPage(Number(event.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded border border-gray-300 p-1.5 shadow-sm transition-all hover:bg-white disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="mx-2 flex items-center gap-1">
              {Array.from({ length: Math.min(paginationData.last_page, 5) }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-8 w-8 rounded text-xs font-bold transition-all ${
                      currentPage === pageNumber ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              {paginationData.last_page > 5 && <span className="px-1 italic text-gray-400">...</span>}
            </div>
            <button
              disabled={currentPage === paginationData.last_page}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded border border-gray-300 p-1.5 shadow-sm transition-all hover:bg-white disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {showFormModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit User' : 'Tambah User Baru'}</h2>
                <p className="mt-1 text-xs text-gray-400">Sesuaikan role dan bidang agar akses data tepat.</p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="rounded-full border border-transparent p-2 transition-all hover:border-gray-100 hover:bg-white hover:shadow-sm"
              >
                <XIcon size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, full_name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-semibold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Contoh: Ahmad Fauzan"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    placeholder="user@sirangkul.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Role</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(event) => {
                      const nextRole = event.target.value;

                      if (requiresBidang(nextRole) && bidangs.length === 0 && !isBidangsLoading) {
                        fetchBidangs();
                      }

                      setFormData((prev) => ({
                        ...prev,
                        role: nextRole,
                        bidang_id: requiresBidang(nextRole) ? prev.bidang_id : '',
                      }));
                    }}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Pilih Role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Bidang</label>
                <select
                  required={requiresBidang(formData.role)}
                  disabled={!requiresBidang(formData.role)}
                  value={requiresBidang(formData.role) ? formData.bidang_id : ''}
                  onChange={(event) => setFormData((prev) => ({ ...prev, bidang_id: event.target.value }))}
                  className={`w-full appearance-none rounded-xl border px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${
                    requiresBidang(formData.role)
                      ? 'border-gray-200 bg-gray-50'
                      : 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400'
                  }`}
                >
                  {!formData.role && (
                    <option value="">Pilih role terlebih dahulu</option>
                  )}
                  {formData.role && !requiresBidang(formData.role) && (
                    <option value="">Role ini mengakses semua bidang</option>
                  )}
                  {requiresBidang(formData.role) && (
                    <>
                      <option value="">
                        {isBidangsLoading
                          ? 'Memuat daftar bidang...'
                          : bidangOptions.length > 0
                            ? 'Pilih Bidang'
                            : 'Belum ada bidang tersedia'}
                      </option>
                      {bidangOptions.map((bidang) => (
                        <option key={bidang.id} value={bidang.id}>{bidang.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {!formData.role
                    ? 'Pilih role terlebih dahulu agar aturan akses bidang bisa ditentukan.'
                    : requiresBidang(formData.role)
                      ? 'Pengguna hanya akan melihat RKAM dan proposal pada bidang ini.'
                      : 'Administrator dan Bendahara tidak dibatasi ke satu bidang.'}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">Status Akun</label>
                <div className="flex gap-4">
                  <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 transition-all ${formData.status === 'Active' ? 'border-green-500 bg-green-50 font-bold text-green-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    <input
                      type="radio"
                      name="status"
                      className="hidden"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'Active' }))}
                    />
                    <CheckCircle size={20} />
                    Aktif
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 transition-all ${formData.status === 'Inactive' ? 'border-red-500 bg-red-50 font-bold text-red-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                    <input
                      type="radio"
                      name="status"
                      className="hidden"
                      checked={formData.status === 'Inactive'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'Inactive' }))}
                    />
                    <XCircle size={20} />
                    Non-Aktif
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-400">
                  Password {editingId && <span className="normal-case italic font-normal text-[10px]">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Minimal 8 karakter"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700"
                >
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan User'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Hapus Pengguna"
        message="Menghapus pengguna akan memutus akses akun tersebut dari sistem. Lanjutkan?"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UserManagement;
