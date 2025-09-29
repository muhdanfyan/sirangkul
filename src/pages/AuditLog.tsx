import React, { useState } from 'react';
import { Search, Calendar, User, Activity, Filter, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Warning';
}

const AuditLog: React.FC = () => {
  const [logs] = useState<AuditLog[]>([
    {
      id: 'LOG001',
      userId: '2',
      userName: 'Ahmad Fauzi',
      userRole: 'Pengusul',
      action: 'CREATE',
      module: 'Proposal',
      details: 'Membuat proposal baru: Renovasi Ruang Kelas 7A',
      ipAddress: '192.168.1.101',
      timestamp: '2025-01-15 14:30:25',
      status: 'Success'
    },
    {
      id: 'LOG002',
      userId: '3',
      userName: 'Siti Nurhaliza',
      userRole: 'Verifikator',
      action: 'UPDATE',
      module: 'Approval',
      details: 'Menyetujui proposal PR002 - Pembelian Komputer Lab',
      ipAddress: '192.168.1.102',
      timestamp: '2025-01-15 13:45:12',
      status: 'Success'
    },
    {
      id: 'LOG003',
      userId: '1',
      userName: 'Admin Sistem',
      userRole: 'Administrator',
      action: 'CREATE',
      module: 'User Management',
      details: 'Menambahkan user baru: Muhammad Ali (Verifikator)',
      ipAddress: '192.168.1.100',
      timestamp: '2025-01-15 12:20:35',
      status: 'Success'
    },
    {
      id: 'LOG004',
      userId: '5',
      userName: 'Fatimah S.Pd',
      userRole: 'Bendahara',
      action: 'UPDATE',
      module: 'Payment',
      details: 'Memproses pembayaran PAY001 - Pembelian Komputer Lab',
      ipAddress: '192.168.1.103',
      timestamp: '2025-01-15 11:15:48',
      status: 'Success'
    },
    {
      id: 'LOG005',
      userId: '2',
      userName: 'Ahmad Fauzi',
      userRole: 'Pengusul',
      action: 'LOGIN',
      module: 'Authentication',
      details: 'Login ke sistem',
      ipAddress: '192.168.1.101',
      timestamp: '2025-01-15 10:30:12',
      status: 'Success'
    },
    {
      id: 'LOG006',
      userId: '4',
      userName: 'Dr. H. Muhammad',
      userRole: 'Kepala Madrasah',
      action: 'UPDATE',
      module: 'RKAM',
      details: 'Mengubah pagu anggaran 5.1.1.01 - Belanja Gaji Pokok PNS',
      ipAddress: '192.168.1.104',
      timestamp: '2025-01-15 09:45:30',
      status: 'Success'
    },
    {
      id: 'LOG007',
      userId: '2',
      userName: 'Ahmad Fauzi',
      userRole: 'Pengusul',
      action: 'FAILED_LOGIN',
      module: 'Authentication',
      details: 'Gagal login - password salah',
      ipAddress: '192.168.1.105',
      timestamp: '2025-01-15 08:20:15',
      status: 'Failed'
    },
    {
      id: 'LOG008',
      userId: '6',
      userName: 'H. Abdullah',
      userRole: 'Komite Madrasah',
      action: 'UPDATE',
      module: 'Approval',
      details: 'Menolak proposal PR004 - Pengadaan Buku Perpustakaan',
      ipAddress: '192.168.1.106',
      timestamp: '2025-01-14 16:30:45',
      status: 'Warning'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-blue-100 text-blue-800';
      case 'UPDATE':
        return 'bg-green-100 text-green-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      case 'FAILED_LOGIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === '' || log.module === moduleFilter;
    const matchesStatus = statusFilter === '' || log.status === statusFilter;
    return matchesSearch && matchesModule && matchesStatus;
  });

  const exportLogs = (format: string) => {
    alert(`Mengekspor audit log dalam format ${format.toUpperCase()}`);
  };

  const modules = Array.from(new Set(logs.map(log => log.module)));
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'Success').length,
    failed: logs.filter(l => l.status === 'Failed').length,
    warning: logs.filter(l => l.status === 'Warning').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Catatan aktivitas semua pengguna sistem</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportLogs('csv')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </button>
          <button
            onClick={() => exportLogs('excel')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Aktivitas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Berhasil</p>
              <p className="text-3xl font-bold text-green-600">{stats.success}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gagal</p>
              <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warning</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select 
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Module</option>
            {modules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Warning">Warning</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Waktu</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">User</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Aksi</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Module</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700">Detail</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-6 font-medium text-gray-700">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{log.userName}</div>
                          <div className="text-sm text-gray-600">{log.userRole}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">{log.module}</td>
                  <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 text-center font-mono">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {filteredLogs.length} dari {logs.length} entries
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                2
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;