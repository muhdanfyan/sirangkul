# Frontend TODO: Proposal API Integration (React)

> **Tanggal dibuat**: 6 November 2025  
> **Backend**: Laravel API  
> **Frontend**: React + Axios  
> **Status**: Ready for implementation

---

## 📋 Overview

Dokumen ini berisi checklist lengkap untuk implementasi fetching Proposal dari backend Laravel API ke frontend React. Proposal sekarang **bergantung pada RKAM**, jadi setiap proposal harus memilih RKAM yang tersedia terlebih dahulu.

---

## 🔗 API Base URL

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

---

## 🎯 Konsep Proposal & RKAM

```
RKAM (Master Budget)
  ↓
Proposal (mengacu ke RKAM)
  ↓
Validasi: jumlah_pengajuan <= sisa RKAM
```

**Flow:**
1. User memilih RKAM yang tersedia
2. User membuat proposal dengan `rkam_id` dan `jumlah_pengajuan`
3. Backend validasi: apakah `jumlah_pengajuan` <= `sisa RKAM`
4. Jika valid, proposal dibuat
5. Status proposal: draft → submitted → approved/rejected

---

## ✅ Checklist Implementation

### **1. Setup & Configuration**

#### [ ] 1.1. Install Axios (jika belum)

```bash
npm install axios
```

#### [ ] 1.2. Buat API Config File

**File**: `src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### **2. Create Proposal Service**

#### [ ] 2.1. Buat Proposal Service

**File**: `src/services/proposalService.js`

```javascript
import apiClient from './api';

const proposalService = {
  /**
   * GET /api/proposals
   * Get all proposals (with filters)
   */
  getAllProposals: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.rkam_id) params.append('rkam_id', filters.rkam_id);
      
      const response = await apiClient.get(`/proposals?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * GET /api/proposals/{id}
   * Get single proposal detail
   */
  getProposalById: async (id) => {
    try {
      const response = await apiClient.get(`/proposals/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * POST /api/proposals
   * Create new proposal
   */
  createProposal: async (proposalData) => {
    try {
      const response = await apiClient.post('/proposals', proposalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * PUT /api/proposals/{id}
   * Update proposal
   */
  updateProposal: async (id, proposalData) => {
    try {
      const response = await apiClient.put(`/proposals/${id}`, proposalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * DELETE /api/proposals/{id}
   * Delete proposal
   */
  deleteProposal: async (id) => {
    try {
      const response = await apiClient.delete(`/proposals/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default proposalService;
```

---

### **3. Create RKAM Service**

#### [ ] 3.1. Buat RKAM Service (untuk dropdown di form)

**File**: `src/services/rkamService.js`

```javascript
import apiClient from './api';

const rkamService = {
  /**
   * GET /api/rkam
   * Get all RKAM (untuk dropdown/select)
   */
  getAllRkam: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.kategori) params.append('kategori', filters.kategori);
      if (filters.tahun_anggaran) params.append('tahun_anggaran', filters.tahun_anggaran);
      if (filters.search) params.append('search', filters.search);
      
      const response = await apiClient.get(`/rkam?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * GET /api/rkam/{id}
   * Get single RKAM detail (untuk cek sisa budget)
   */
  getRkamById: async (id) => {
    try {
      const response = await apiClient.get(`/rkam/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * GET /api/rkam/{id}/proposals
   * Get all proposals for specific RKAM
   */
  getRkamProposals: async (id) => {
    try {
      const response = await apiClient.get(`/rkam/${id}/proposals`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default rkamService;
```

---

### **4. Create React Components**

#### [ ] 4.1. Proposal List Component

**File**: `src/components/Proposal/ProposalList.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import proposalService from '../../services/proposalService';
import { Link } from 'react-router-dom';

const ProposalList = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    fetchProposals();
  }, [filters]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getAllProposals(filters);
      setProposals(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch proposals');
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus proposal ini?')) {
      return;
    }

    try {
      await proposalService.deleteProposal(id);
      alert('Proposal berhasil dihapus');
      fetchProposals(); // Refresh list
    } catch (err) {
      alert(err.message || 'Gagal menghapus proposal');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return (
      <span className={`px-2 py-1 text-xs text-white rounded ${statusColors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) return <div>Loading proposals...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Daftar Proposal</h1>
        <Link
          to="/proposals/create"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Buat Proposal Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">Judul</th>
              <th className="px-4 py-2 border">RKAM</th>
              <th className="px-4 py-2 border">Jumlah Pengajuan</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Tanggal</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Tidak ada proposal
                </td>
              </tr>
            ) : (
              proposals.map((proposal, index) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{index + 1}</td>
                  <td className="px-4 py-2 border">{proposal.title}</td>
                  <td className="px-4 py-2 border">
                    {proposal.rkam?.item_name || '-'}
                  </td>
                  <td className="px-4 py-2 border text-right">
                    Rp {Number(proposal.jumlah_pengajuan).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {getStatusBadge(proposal.status)}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(proposal.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <Link
                      to={`/proposals/${proposal.id}`}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Detail
                    </Link>
                    {proposal.status === 'draft' && (
                      <>
                        <Link
                          to={`/proposals/${proposal.id}/edit`}
                          className="text-green-500 hover:underline mr-2"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="text-red-500 hover:underline"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProposalList;
```

---

#### [ ] 4.2. Proposal Create/Edit Form Component

**File**: `src/components/Proposal/ProposalForm.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import proposalService from '../../services/proposalService';
import rkamService from '../../services/rkamService';

const ProposalForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    rkam_id: '',
    title: '',
    description: '',
    jumlah_pengajuan: '',
  });

  const [rkamList, setRkamList] = useState([]);
  const [selectedRkam, setSelectedRkam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRkamList();
    if (isEdit && id) {
      fetchProposal();
    }
  }, [isEdit, id]);

  const fetchRkamList = async () => {
    try {
      const response = await rkamService.getAllRkam();
      setRkamList(response.data);
    } catch (err) {
      console.error('Error fetching RKAM:', err);
    }
  };

  const fetchProposal = async () => {
    try {
      const response = await proposalService.getProposalById(id);
      const proposal = response.data;
      setFormData({
        rkam_id: proposal.rkam_id,
        title: proposal.title,
        description: proposal.description || '',
        jumlah_pengajuan: proposal.jumlah_pengajuan,
      });
      setSelectedRkam(proposal.rkam);
    } catch (err) {
      alert('Gagal memuat data proposal');
      navigate('/proposals');
    }
  };

  const handleRkamChange = async (rkamId) => {
    setFormData({ ...formData, rkam_id: rkamId });
    
    // Fetch RKAM detail untuk menampilkan sisa budget
    if (rkamId) {
      try {
        const response = await rkamService.getRkamById(rkamId);
        setSelectedRkam(response.data);
      } catch (err) {
        console.error('Error fetching RKAM detail:', err);
      }
    } else {
      setSelectedRkam(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isEdit) {
        await proposalService.updateProposal(id, formData);
        alert('Proposal berhasil diupdate');
      } else {
        await proposalService.createProposal(formData);
        alert('Proposal berhasil dibuat');
      }
      navigate('/proposals');
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        alert(err.message || 'Gagal menyimpan proposal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? 'Edit Proposal' : 'Buat Proposal Baru'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RKAM Selection */}
        <div>
          <label className="block font-semibold mb-1">
            RKAM <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.rkam_id}
            onChange={(e) => handleRkamChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">-- Pilih RKAM --</option>
            {rkamList.map((rkam) => (
              <option key={rkam.id} value={rkam.id}>
                {rkam.kategori} - {rkam.item_name} (Sisa: Rp{' '}
                {Number(rkam.sisa).toLocaleString('id-ID')})
              </option>
            ))}
          </select>
          {errors.rkam_id && (
            <p className="text-red-500 text-sm mt-1">{errors.rkam_id[0]}</p>
          )}
        </div>

        {/* RKAM Info */}
        {selectedRkam && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <h3 className="font-semibold mb-2">Informasi RKAM:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Kategori:</span> {selectedRkam.kategori}
              </div>
              <div>
                <span className="font-medium">Tahun:</span> {selectedRkam.tahun_anggaran}
              </div>
              <div>
                <span className="font-medium">Pagu:</span> Rp{' '}
                {Number(selectedRkam.pagu).toLocaleString('id-ID')}
              </div>
              <div>
                <span className="font-medium">Terpakai:</span> Rp{' '}
                {Number(selectedRkam.terpakai).toLocaleString('id-ID')}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Sisa Anggaran:</span>{' '}
                <span className="text-green-600 font-bold">
                  Rp {Number(selectedRkam.sisa).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block font-semibold mb-1">
            Judul Proposal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Contoh: Renovasi Ruang Kelas 1A"
            required
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1">Deskripsi</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            rows="4"
            placeholder="Jelaskan detail proposal Anda..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>
          )}
        </div>

        {/* Jumlah Pengajuan */}
        <div>
          <label className="block font-semibold mb-1">
            Jumlah Pengajuan (Rp) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.jumlah_pengajuan}
            onChange={(e) =>
              setFormData({ ...formData, jumlah_pengajuan: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            placeholder="Contoh: 15000000"
            min="0"
            step="1000"
            required
          />
          {errors.jumlah_pengajuan && (
            <p className="text-red-500 text-sm mt-1">
              {errors.jumlah_pengajuan[0]}
            </p>
          )}
          {selectedRkam && formData.jumlah_pengajuan && (
            <p className="text-sm text-gray-600 mt-1">
              {Number(formData.jumlah_pengajuan) > selectedRkam.sisa ? (
                <span className="text-red-500">
                  ⚠️ Melebihi sisa anggaran RKAM!
                </span>
              ) : (
                <span className="text-green-500">
                  ✓ Dalam batas anggaran RKAM
                </span>
              )}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Buat Proposal'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/proposals')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm;
```

---

#### [ ] 4.3. Proposal Detail Component

**File**: `src/components/Proposal/ProposalDetail.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import proposalService from '../../services/proposalService';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await proposalService.getProposalById(id);
      setProposal(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch proposal');
      console.error('Error fetching proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus proposal ini?')) {
      return;
    }

    try {
      await proposalService.deleteProposal(id);
      alert('Proposal berhasil dihapus');
      navigate('/proposals');
    } catch (err) {
      alert(err.message || 'Gagal menghapus proposal');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'text-gray-600 bg-gray-100',
      submitted: 'text-blue-600 bg-blue-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!proposal) return <div className="p-4">Proposal tidak ditemukan</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Detail Proposal</h1>
        <Link
          to="/proposals"
          className="text-blue-500 hover:underline"
        >
          ← Kembali ke Daftar
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        {/* Status Badge */}
        <div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
              proposal.status
            )}`}
          >
            {proposal.status.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold">{proposal.title}</h2>
        </div>

        {/* Description */}
        {proposal.description && (
          <div>
            <h3 className="font-semibold mb-1">Deskripsi:</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>
        )}

        {/* RKAM Info */}
        {proposal.rkam && (
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-semibold mb-2">Informasi RKAM:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Kategori:</span>{' '}
                {proposal.rkam.kategori}
              </div>
              <div>
                <span className="font-medium">Item:</span>{' '}
                {proposal.rkam.item_name}
              </div>
              <div>
                <span className="font-medium">Pagu RKAM:</span> Rp{' '}
                {Number(proposal.rkam.pagu).toLocaleString('id-ID')}
              </div>
              <div>
                <span className="font-medium">Sisa RKAM:</span> Rp{' '}
                {Number(proposal.rkam.sisa).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}

        {/* Jumlah Pengajuan */}
        <div>
          <h3 className="font-semibold mb-1">Jumlah Pengajuan:</h3>
          <p className="text-2xl font-bold text-green-600">
            Rp {Number(proposal.jumlah_pengajuan).toLocaleString('id-ID')}
          </p>
        </div>

        {/* User Info */}
        {proposal.user && (
          <div>
            <h3 className="font-semibold mb-1">Diajukan oleh:</h3>
            <p>{proposal.user.name || proposal.user.email}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Dibuat:</span>{' '}
            {new Date(proposal.created_at).toLocaleString('id-ID')}
          </div>
          <div>
            <span className="font-medium">Diupdate:</span>{' '}
            {new Date(proposal.updated_at).toLocaleString('id-ID')}
          </div>
          {proposal.submitted_at && (
            <div>
              <span className="font-medium">Disubmit:</span>{' '}
              {new Date(proposal.submitted_at).toLocaleString('id-ID')}
            </div>
          )}
          {proposal.approved_at && (
            <div>
              <span className="font-medium">Disetujui:</span>{' '}
              {new Date(proposal.approved_at).toLocaleString('id-ID')}
            </div>
          )}
          {proposal.rejected_at && (
            <div>
              <span className="font-medium">Ditolak:</span>{' '}
              {new Date(proposal.rejected_at).toLocaleString('id-ID')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {proposal.status === 'draft' && (
            <>
              <Link
                to={`/proposals/${proposal.id}/edit`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Hapus
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;
```

---

### **5. Setup React Router**

#### [ ] 5.1. Configure Routes

**File**: `src/App.jsx` (atau `src/routes/index.jsx`)

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProposalList from './components/Proposal/ProposalList';
import ProposalForm from './components/Proposal/ProposalForm';
import ProposalDetail from './components/Proposal/ProposalDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Proposal Routes */}
        <Route path="/proposals" element={<ProposalList />} />
        <Route path="/proposals/create" element={<ProposalForm />} />
        <Route path="/proposals/:id" element={<ProposalDetail />} />
        <Route path="/proposals/:id/edit" element={<ProposalForm isEdit={true} />} />
        
        {/* Other routes... */}
      </Routes>
    </Router>
  );
}

export default App;
```

---

### **6. Testing Checklist**

#### [ ] 6.1. Test GET All Proposals
- Buka `/proposals`
- Pastikan list proposals muncul
- Test filter by status

#### [ ] 6.2. Test Create Proposal
- Klik "Buat Proposal Baru"
- Pilih RKAM dari dropdown
- Pastikan info RKAM muncul (pagu, sisa)
- Isi form dan submit
- Cek validasi error jika jumlah melebihi sisa RKAM

#### [ ] 6.3. Test View Proposal Detail
- Klik detail pada salah satu proposal
- Pastikan semua info ditampilkan dengan benar

#### [ ] 6.4. Test Edit Proposal
- Edit proposal dengan status "draft"
- Ubah jumlah pengajuan
- Submit dan cek hasilnya

#### [ ] 6.5. Test Delete Proposal
- Hapus proposal dengan status "draft"
- Pastikan konfirmasi muncul
- Cek list setelah delete

#### [ ] 6.6. Test Validation
- Coba buat proposal dengan jumlah > sisa RKAM
- Pastikan muncul error dari backend
- Coba submit form kosong
- Coba pilih RKAM dengan sisa = 0

---

## 📊 Data Structure Reference

### Proposal Object (dari API)
```javascript
{
  "success": true,
  "message": "Proposal retrieved successfully",
  "data": {
    "id": "uuid",
    "rkam_id": "uuid",
    "user_id": "uuid",
    "title": "Renovasi Ruang Kelas 1A",
    "description": "Deskripsi detail...",
    "jumlah_pengajuan": "15000000.00",
    "status": "draft", // draft, submitted, approved, rejected
    "submitted_at": null,
    "approved_at": null,
    "rejected_at": null,
    "created_at": "2025-11-06T10:00:00.000000Z",
    "updated_at": "2025-11-06T10:00:00.000000Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "rkam": {
      "id": "uuid",
      "kategori": "Renovasi",
      "item_name": "Renovasi Gedung Sekolah",
      "pagu": "50000000.00",
      "tahun_anggaran": 2025,
      "terpakai": "15000000.00",
      "sisa": "35000000.00",
      "persentase": 30,
      "status": "Normal"
    }
  }
}
```

### RKAM Object (dari API)
```javascript
{
  "success": true,
  "message": "RKAM list retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "kategori": "Renovasi",
      "item_name": "Renovasi Gedung Sekolah",
      "pagu": "50000000.00",
      "tahun_anggaran": 2025,
      "deskripsi": "Renovasi gedung utama...",
      "terpakai": "15000000.00",
      "sisa": "35000000.00",
      "persentase": 30,
      "status": "Normal",
      "created_at": "2025-11-06T08:00:00.000000Z",
      "updated_at": "2025-11-06T08:00:00.000000Z"
    }
  ]
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install axios react-router-dom

# 2. Start development server
npm run dev

# 3. Test API connection
# Make sure Laravel backend is running on http://127.0.0.1:8000
```

---

## 📝 Notes

1. **Authentication Required**: Semua endpoint memerlukan Bearer token. Pastikan user sudah login dan token tersimpan di localStorage.

2. **RKAM Dependency**: Proposal WAJIB memiliki `rkam_id`. Pastikan ada RKAM yang tersedia sebelum user membuat proposal.

3. **Budget Validation**: Backend akan otomatis validasi apakah `jumlah_pengajuan` melebihi `sisa RKAM`. Tampilkan error dengan jelas di UI.

4. **Status Flow**: 
   - **draft** → User bisa edit/delete
   - **submitted** → User tidak bisa edit/delete (menunggu approval)
   - **approved** → Tidak bisa diubah
   - **rejected** → Tidak bisa diubah

5. **Real-time RKAM Info**: Saat user memilih RKAM di form, fetch detail RKAM untuk menampilkan sisa budget secara real-time.

6. **Error Handling**: Tangani error dari backend dengan baik, terutama validation errors (422) dan authorization errors (401).

---

## 🎉 Setelah Selesai

Setelah semua checklist selesai:
1. ✅ Test semua flow (Create, Read, Update, Delete)
2. ✅ Test validasi budget dengan berbagai skenario
3. ✅ Test filter dan search
4. ✅ Test error handling
5. ✅ Deploy ke staging untuk UAT

**Good luck! 🚀**
