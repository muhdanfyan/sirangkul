import React, { useEffect, useState } from "react";
import { Plus, Search, CreditCard as Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { apiService } from "../services/api";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await apiService.getUsers();
      console.log(response);
      setUsers(response as unknown as User[]);
    };
    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Handle form submission logic here
    // console.log("Form submitted with data:", form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      const newUser = {
        full_name: form.full_name,
        email: form.email,
        role: form.role.toLowerCase(),
        ...(form.password && { password: form.password })
      };

      if (editingUserId) {
        await apiService.updateUser(editingUserId, newUser);
        alert("User successfully updated!");
      } else {
        await apiService.addUser(newUser);
        alert("User successfully added!");
      }

      // Refresh user list
      const response = await apiService.getUsers();
      setUsers(response as unknown as User[]);

      // Reset form
      setForm({
        full_name: "",
        email: "",
        role: "",
        password: ""
      });
      setShowModal(false);
      setLoading(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Gagal menyimpan user")
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (user: User) => {
    console.log('Editing user:', user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setEditingUserId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      setLoading(true);
      await apiService.delUser(userId);
      // Refresh user list
      const fetchUsers = async () => {
        const response = await apiService.getUsers();
        setUsers(response as unknown as User[]);
      };
      fetchUsers();
      setLoading(false);
    } catch (error) {
      console.error("Error menghapus user:", error);
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      "Administrator": "bg-red-100 text-red-800",
      "Pengusul": "bg-blue-100 text-blue-800",
      "Verifikator": "bg-green-100 text-green-800",
      "Kepala Madrasah": "bg-purple-100 text-purple-800",
      "Bendahara": "bg-yellow-100 text-yellow-800",
      "Komite Madrasah": "bg-gray-100 text-gray-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses sistem</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Semua Role</option>
            <option value="Administrator">Administrator</option>
            <option value="Pengusul">Pengusul</option>
            <option value="Verifikator">Verifikator</option>
            <option value="Kepala Madrasah">Kepala Madrasah</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Komite Madrasah">Komite Madrasah</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">User</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Dibuat</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.email}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {user.createdAt}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center space-x-2">
                      <button type="button" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        {user.status === "Active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => { confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.full_name}?`) && handleDelete(user.id) }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-4 px-6 text-center text-gray-600">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingUserId ? 'Edit User' : 'Tambah User Baru'}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  name="full_name"
                  type="text"
                  value={form.full_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan email"
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  name="role" 
                  value={form.role || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={handleChange}
                >
                  <option value="">Pilih Role</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Pengusul">Pengusul</option>
                  <option value="Verifikator">Verifikator</option>
                  <option value="Kepala Madrasah">Kepala Madrasah</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Komite Madrasah">Komite Madrasah</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password"
                  onChange={handleChange}
                />
              </div>
            </form>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={handleSaveUser}
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;