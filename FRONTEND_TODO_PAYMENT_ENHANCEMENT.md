# 📋 Frontend TODO - Payment & Proposal Enhancement

## 🎯 Main Features to Implement

### 1. **PAYMENT PROOF UPLOAD - File Upload Support**
**Priority**: 🔴 HIGH
**Page**: `PaymentManagement.tsx`

**Current Issue:**
- Complete payment modal hanya input URL text
- Tidak ada file upload
- Tidak ada validation required

**Changes Required:**

#### **A. Add File Upload State**
```tsx
const [proofFile, setProofFile] = useState<File | null>(null);
const [proofPreview, setProofPreview] = useState<string | null>(null);
```

#### **B. Update Complete Payment Form**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Bukti Pembayaran * (Required)
  </label>
  
  {/* Option 1: Upload File */}
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
    <input
      type="file"
      accept="image/*,.pdf"
      onChange={handleFileChange}
      className="hidden"
      id="proof-upload"
    />
    <label htmlFor="proof-upload" className="cursor-pointer">
      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-600">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-gray-500 mt-1">
        PNG, JPG, PDF up to 10MB
      </p>
    </label>
  </div>

  {/* Preview */}
  {proofFile && (
    <div className="mt-2 flex items-center gap-2 text-sm">
      <FileText className="h-4 w-4 text-green-500" />
      <span>{proofFile.name}</span>
      <button onClick={() => setProofFile(null)}>
        <XCircle className="h-4 w-4 text-red-500" />
      </button>
    </div>
  )}

  {/* Option 2: Or paste URL */}
  <div className="mt-3">
    <label className="block text-xs text-gray-600 mb-1">Atau paste URL:</label>
    <input
      type="url"
      value={completeForm.payment_proof_url}
      onChange={(e) => setCompleteForm({ ...completeForm, payment_proof_url: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      placeholder="https://..."
    />
  </div>
</div>
```

#### **C. Update handleCompletePayment()**
```tsx
const handleCompletePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPayment) return;

  // Validation
  if (!proofFile && !completeForm.payment_proof_url) {
    setToast({ 
      message: 'Bukti pembayaran wajib diupload atau URL harus diisi!', 
      type: 'error' 
    });
    return;
  }

  try {
    setActionLoading(true);

    // Create FormData for file upload
    const formData = new FormData();
    
    if (proofFile) {
      formData.append('payment_proof_file', proofFile);
    }
    
    if (completeForm.payment_proof_url) {
      formData.append('payment_proof_url', completeForm.payment_proof_url);
    }
    
    if (completeForm.admin_notes) {
      formData.append('admin_notes', completeForm.admin_notes);
    }

    const response = await apiService.completePaymentWithFile(selectedPayment.id, formData);
    const { rkam_update } = response.data;
    
    setInfoModal({
      isOpen: true,
      title: 'Pembayaran Berhasil Diselesaikan!',
      message: 
        `RKAM telah diperbarui:\n\n` +
        `Terpakai Sebelum: Rp ${rkam_update.old_terpakai.toLocaleString('id-ID')}\n` +
        `Terpakai Sekarang: Rp ${rkam_update.new_terpakai.toLocaleString('id-ID')}\n` +
        `Sisa Budget: Rp ${rkam_update.new_sisa.toLocaleString('id-ID')}`,
      type: 'success'
    });
    
    // Reset
    setCompleteForm({ payment_proof_url: '', admin_notes: '' });
    setProofFile(null);
    setProofPreview(null);
    setShowCompleteModal(false);
    setSelectedPayment(null);
    await fetchData();
    
  } catch (err: unknown) {
    setToast({
      message: `Gagal menyelesaikan pembayaran: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`,
      type: 'error'
    });
  } finally {
    setActionLoading(false);
  }
};
```

#### **D. Update API Service**
```tsx
// src/services/api.ts

completePaymentWithFile: async (paymentId: string, formData: FormData) => {
  const response = await apiClient.post(
    `/payments/${paymentId}/complete`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
}
```

---

### 2. **MY PROPOSALS PAGE - Pengusul Dashboard**
**Priority**: 🔴 HIGH
**New Page**: `MyProposals.tsx`

**Purpose:**
- Pengusul dapat melihat semua proposal mereka
- Lihat status proposal (approved, rejected, completed)
- Lihat bukti pembayaran jika sudah dibayar
- Lihat alasan penolakan jika ditolak

**Features:**

#### **A. Stats Cards**
```tsx
interface ProposalStats {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  completed: number;
  total_amount_completed: number;
}

// Cards UI
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard icon={FileText} label="Total Proposal" value={stats.total} color="blue" />
  <StatCard icon={CheckCircle} label="Disetujui" value={stats.approved} color="green" />
  <StatCard icon={XCircle} label="Ditolak" value={stats.rejected} color="red" />
  <StatCard icon={DollarSign} label="Total Dibayar" value={formatRupiah(stats.total_amount_completed)} color="green" />
</div>
```

#### **B. Proposal List with Status**
```tsx
<table>
  <thead>
    <tr>
      <th>Proposal</th>
      <th>Jumlah</th>
      <th>Status</th>
      <th>Tanggal</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {proposals.map(proposal => (
      <tr key={proposal.id}>
        <td>
          <div>
            <p className="font-medium">{proposal.title}</p>
            <p className="text-xs text-gray-500">{proposal.description}</p>
          </div>
        </td>
        <td>{formatRupiah(proposal.jumlah_pengajuan)}</td>
        <td>
          <StatusBadge status={proposal.status} />
          {proposal.status === 'rejected' && (
            <button onClick={() => showRejectionReason(proposal)}>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </button>
          )}
        </td>
        <td>{formatDate(proposal.created_at)}</td>
        <td>
          <button onClick={() => viewDetail(proposal)}>Detail</button>
          {proposal.status === 'completed' && proposal.payment && (
            <button onClick={() => viewPaymentProof(proposal.payment)}>
              Bukti Bayar
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### **C. Proposal Detail Modal**
```tsx
{showDetailModal && selectedProposal && (
  <div className="modal">
    <h3>{selectedProposal.title}</h3>
    
    {/* Basic Info */}
    <section>
      <h4>Informasi Proposal</h4>
      <p>Jumlah: {formatRupiah(selectedProposal.jumlah_pengajuan)}</p>
      <p>Status: <StatusBadge status={selectedProposal.status} /></p>
      <p>RKAM: {selectedProposal.rkam.kategori}</p>
    </section>

    {/* Timeline */}
    <section>
      <h4>Timeline Persetujuan</h4>
      <Timeline proposal={selectedProposal} />
    </section>

    {/* Rejection Info */}
    {selectedProposal.status === 'rejected' && (
      <section className="bg-red-50 p-4 rounded">
        <h4>Alasan Penolakan</h4>
        <p>{selectedProposal.rejection_reason}</p>
        <p className="text-xs">
          Ditolak oleh: {selectedProposal.rejected_by_user?.full_name}
        </p>
        <p className="text-xs">
          Tanggal: {formatDate(selectedProposal.rejected_at)}
        </p>
      </section>
    )}

    {/* Payment Info */}
    {selectedProposal.status === 'completed' && selectedProposal.payment && (
      <section className="bg-green-50 p-4 rounded">
        <h4>Informasi Pembayaran</h4>
        <p>Jumlah: {formatRupiah(selectedProposal.payment.amount)}</p>
        <p>Metode: {selectedProposal.payment.payment_method}</p>
        <p>Tanggal: {formatDate(selectedProposal.payment.completed_at)}</p>
        
        {/* Payment Proof */}
        {selectedProposal.payment.payment_proof_file && (
          <button onClick={() => downloadProof(selectedProposal.payment.id)}>
            <Download className="h-4 w-4 mr-2" />
            Download Bukti Pembayaran
          </button>
        )}
        
        {selectedProposal.payment.payment_proof_url && (
          <a href={selectedProposal.payment.payment_proof_url} target="_blank">
            <ExternalLink className="h-4 w-4 mr-2" />
            Lihat Bukti Pembayaran
          </a>
        )}

        {/* Admin Notes */}
        {selectedProposal.payment.admin_notes && (
          <div className="mt-2">
            <p className="text-xs text-gray-600">Catatan Bendahara:</p>
            <p className="text-sm">{selectedProposal.payment.admin_notes}</p>
          </div>
        )}
      </section>
    )}
  </div>
)}
```

#### **D. Rejection Reason Modal**
```tsx
{showRejectionModal && selectedProposal && (
  <div className="modal">
    <div className="flex items-start gap-3">
      <XCircle className="h-12 w-12 text-red-500" />
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          Proposal Ditolak
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {selectedProposal.title}
        </p>
      </div>
    </div>

    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-medium text-red-900 mb-2">Alasan Penolakan:</h4>
      <p className="text-red-800">{selectedProposal.rejection_reason}</p>
    </div>

    <div className="mt-4 text-sm text-gray-600">
      <p>Ditolak oleh: <strong>{selectedProposal.rejected_by_user?.full_name}</strong></p>
      <p>Tanggal: {formatDate(selectedProposal.rejected_at)}</p>
    </div>

    <button 
      onClick={() => setShowRejectionModal(false)}
      className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg"
    >
      Tutup
    </button>
  </div>
)}
```

---

### 3. **PAYMENT PROOF VIEWER**
**Priority**: 🟠 MEDIUM
**Component**: `PaymentProofModal.tsx`

**Features:**
- View payment proof (image/PDF)
- Download payment proof
- Show proof metadata

```tsx
interface PaymentProofModalProps {
  isOpen: boolean;
  payment: Payment;
  onClose: () => void;
}

const PaymentProofModal: React.FC<PaymentProofModalProps> = ({ isOpen, payment, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await apiService.downloadPaymentProof(payment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bukti_pembayaran_${payment.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mendownload bukti pembayaran');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Bukti Pembayaran</h3>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Proof Display */}
        {payment.payment_proof_file && (
          <div className="bg-gray-50 rounded-lg p-4">
            {payment.payment_proof_file.endsWith('.pdf') ? (
              <iframe
                src={`${API_BASE_URL}/storage/${payment.payment_proof_file}`}
                className="w-full h-96 border rounded"
              />
            ) : (
              <img
                src={`${API_BASE_URL}/storage/${payment.payment_proof_file}`}
                alt="Payment Proof"
                className="max-w-full h-auto mx-auto"
              />
            )}
          </div>
        )}

        {payment.payment_proof_url && (
          <a 
            href={payment.payment_proof_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            <ExternalLink className="inline h-4 w-4 mr-1" />
            Lihat Bukti di URL Eksternal
          </a>
        )}

        {/* Metadata */}
        <div className="mt-4 text-sm text-gray-600">
          <p>Proposal: {payment.proposal?.title}</p>
          <p>Jumlah: {formatRupiah(payment.amount)}</p>
          <p>Tanggal: {formatDate(payment.completed_at)}</p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={loading || !payment.payment_proof_file}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="inline h-4 w-4 mr-2" />
            {loading ? 'Downloading...' : 'Download'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 4. **UPDATE API SERVICE**
**Priority**: 🔴 HIGH
**File**: `src/services/api.ts`

**Add New Methods:**

```tsx
// Payment Interface Update
export interface Payment {
  // ... existing fields
  payment_proof_file?: string;  // NEW
  payment_proof_url?: string;
  // ... rest
}

// Proposal Interface Update
export interface Proposal {
  // ... existing fields
  rejection_reason?: string;     // NEW
  rejected_at?: string | null;   // NEW
  rejected_by?: string | null;   // NEW
  rejected_by_user?: User;       // NEW
  payment?: Payment;             // NEW
  // ... rest
}

// API Methods
export const apiService = {
  // ... existing methods

  // Complete payment with file upload
  completePaymentWithFile: async (paymentId: string, formData: FormData) => {
    const response = await apiClient.post(
      `/payments/${paymentId}/complete`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  // Reject proposal
  rejectProposal: async (proposalId: string, reason: string) => {
    const response = await apiClient.post(
      `/proposals/${proposalId}/reject`,
      { rejection_reason: reason }
    );
    return response.data;
  },

  // Get my proposals (for Pengusul)
  getMyProposals: async (): Promise<Proposal[]> => {
    const response = await apiClient.get('/proposals/my-proposals');
    return response.data.data;
  },

  // Get proposal statistics (for Pengusul)
  getProposalStatistics: async () => {
    const response = await apiClient.get('/proposals/statistics');
    return response.data.data;
  },

  // Download payment proof
  downloadPaymentProof: async (paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/payments/${paymentId}/download-proof`,
      {
        responseType: 'blob'
      }
    );
    return response.data;
  },

  // Get my payments (for Pengusul)
  getMyPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get('/payments/my-payments');
    return response.data.data;
  }
};
```

---

### 5. **UPDATE ROUTES**
**Priority**: 🔴 HIGH
**File**: `src/App.tsx`

**Add Route:**
```tsx
// For Pengusul role
{user?.role === 'Pengusul' && (
  <Route path="/my-proposals" element={<MyProposals />} />
)}
```

**Update Sidebar:**
```tsx
// src/components/Layout/Sidebar.tsx
{user?.role === 'Pengusul' && (
  <>
    <NavLink to="/proposal-submission">
      <Plus /> Buat Proposal
    </NavLink>
    <NavLink to="/my-proposals">
      <FileText /> Proposal Saya
    </NavLink>
    <NavLink to="/proposal-tracking">
      <Search /> Lacak Proposal
    </NavLink>
  </>
)}
```

---

### 6. **REJECTION REASON INPUT**
**Priority**: 🔴 HIGH
**Page**: `ProposalApproval.tsx`

**Update Rejection Modal:**
```tsx
{/* Existing modal for approve/reject */}
{showModal && (
  <div className="modal">
    {modalAction === 'reject' ? (
      <>
        <h3>Tolak Proposal</h3>
        <p>Apakah Anda yakin ingin menolak proposal ini?</p>
        
        {/* Add rejection reason textarea */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alasan Penolakan *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Jelaskan alasan penolakan..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Alasan ini akan dilihat oleh pengusul
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={() => setShowModal(false)}>Batal</button>
          <button 
            onClick={handleReject}
            disabled={!notes.trim()}
            className="bg-red-600 text-white disabled:opacity-50"
          >
            Ya, Tolak Proposal
          </button>
        </div>
      </>
    ) : (
      // Approve modal content
    )}
  </div>
)}
```

---

## 📊 File Structure

```
src/
├── pages/
│   ├── MyProposals.tsx              ✨ NEW
│   ├── PaymentManagement.tsx        🔧 UPDATE
│   └── ProposalApproval.tsx         🔧 UPDATE
├── components/
│   ├── PaymentProofModal.tsx        ✨ NEW
│   ├── ProposalDetailModal.tsx      ✨ NEW
│   ├── RejectionReasonModal.tsx     ✨ NEW
│   └── Layout/
│       └── Sidebar.tsx              🔧 UPDATE
├── services/
│   └── api.ts                       🔧 UPDATE
└── App.tsx                          🔧 UPDATE
```

---

## 🧪 Testing Checklist

### **Payment Proof Upload:**
- [ ] Upload file gambar (JPG, PNG) berhasil
- [ ] Upload file PDF berhasil
- [ ] Validasi file size > 10MB ditolak
- [ ] Validasi required field berfungsi
- [ ] Preview file muncul setelah upload
- [ ] Bisa hapus file yang sudah diupload
- [ ] Bisa input URL sebagai alternatif
- [ ] Error handling saat upload gagal

### **My Proposals Page:**
- [ ] Stats cards menampilkan data yang benar
- [ ] List proposal menampilkan semua proposal user
- [ ] Filter by status berfungsi
- [ ] Search by title berfungsi
- [ ] Status badge menampilkan warna yang tepat
- [ ] Klik detail membuka modal
- [ ] Rejection reason muncul untuk proposal ditolak
- [ ] Payment proof muncul untuk proposal completed

### **Payment Proof Viewer:**
- [ ] Modal membuka saat klik "Lihat Bukti"
- [ ] Image ditampilkan dengan benar
- [ ] PDF ditampilkan dalam iframe
- [ ] Download file berfungsi
- [ ] Loading state ditampilkan saat download
- [ ] Error handling saat file tidak ditemukan

### **Rejection Flow:**
- [ ] Textarea alasan penolakan required
- [ ] Validasi minimal karakter
- [ ] Toast muncul setelah reject berhasil
- [ ] Proposal status berubah ke rejected
- [ ] Alasan penolakan tersimpan di database
- [ ] Pengusul bisa lihat alasan penolakan

---

## 🚀 Implementation Priority

### **Week 1 (CRITICAL):**
1. ✅ Add file upload to complete payment modal
2. ✅ Update API service with new endpoints
3. ✅ Add rejection reason input
4. ✅ Create MyProposals page skeleton

### **Week 2 (HIGH):**
1. ✅ Complete MyProposals page with all features
2. ✅ Create PaymentProofModal component
3. ✅ Add download payment proof
4. ✅ Update routes and navigation

### **Week 3 (MEDIUM):**
1. ✅ Add statistics dashboard for Pengusul
2. ✅ Add filters and search
3. ✅ Add export functionality
4. ✅ Polish UI/UX

### **Week 4 (LOW):**
1. ✅ Add notifications
2. ✅ Add email alerts
3. ✅ Add print receipt feature
4. ✅ Documentation

---

**Estimated Total Time**: 3-4 weeks for complete implementation

**Dependencies:**
- Backend API must be completed first (Week 1-2)
- File upload backend must be working
- Rejection endpoint must be tested
