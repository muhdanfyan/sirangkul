# Backend TODO: Proposal & Approval Workflow Implementation

> **Tanggal dibuat**: 6 November 2025  
> **Backend**: Laravel API  
> **Database**: PostgreSQL/MySQL  
> **Status**: Ready for implementation

---

## 📋 Overview

Dokumen ini berisi checklist lengkap untuk implementasi backend Proposal dengan sistem approval workflow yang terstruktur sesuai alur persetujuan di MAN 2 Kota Makassar.

---

## 🔄 Alur Persetujuan

```
Pengusul (Create) 
  ↓
Verifikator (Verify) 
  ↓
Kepala Madrasah (Approve)
  ↓
Komite Madrasah (Final Approve - Optional)
  ↓
Bendahara (Payment Processing)
```

---

## 🗄️ Database Schema

### ✅ 1. Tabel `proposals`

```sql
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rkam_id UUID NOT NULL,
    user_id UUID NOT NULL, -- Pengusul
    title VARCHAR(255) NOT NULL,
    description TEXT,
    jumlah_pengajuan DECIMAL(15,2) NOT NULL,
    
    -- Status Proposal
    status ENUM(
        'draft',           -- Draft, belum disubmit
        'submitted',       -- Sudah disubmit, menunggu verifikasi
        'verified',        -- Sudah diverifikasi, menunggu kepala
        'approved',        -- Disetujui kepala, menunggu komite (jika perlu)
        'rejected',        -- Ditolak di tahap manapun
        'final_approved',  -- Disetujui komite (final)
        'payment_processing', -- Sedang diproses bendahara
        'completed'        -- Selesai, dana sudah dicairkan
    ) DEFAULT 'draft',
    
    -- Timestamps untuk tracking
    submitted_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    verified_by UUID NULL, -- User ID Verifikator
    approved_at TIMESTAMP NULL,
    approved_by UUID NULL, -- User ID Kepala Madrasah
    rejected_at TIMESTAMP NULL,
    rejected_by UUID NULL,
    rejection_reason TEXT NULL,
    final_approved_at TIMESTAMP NULL,
    final_approved_by UUID NULL, -- User ID Komite
    completed_at TIMESTAMP NULL,
    
    -- Flags
    requires_committee_approval BOOLEAN DEFAULT FALSE, -- Apakah perlu komite?
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (rkam_id) REFERENCES rkam(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (final_approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_rkam ON proposals(rkam_id);
CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_submitted_at ON proposals(submitted_at);
```

### ✅ 2. Tabel `approval_workflows`

Untuk tracking detail setiap tahap persetujuan:

```sql
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL,
    
    -- Approval Stage
    stage ENUM(
        'verification',      -- Tahap verifikasi
        'principal_approval',-- Tahap persetujuan kepala
        'committee_approval' -- Tahap persetujuan komite
    ) NOT NULL,
    sequence INT NOT NULL, -- Urutan (1, 2, 3)
    
    -- Approver Info
    approver_role VARCHAR(50) NOT NULL, -- verifikator, kepala_madrasah, komite
    approver_id UUID NULL, -- User yang approve/reject
    
    -- Status & Action
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    action_at TIMESTAMP NULL,
    notes TEXT NULL, -- Catatan dari approver
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_approval_workflows_proposal ON approval_workflows(proposal_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_workflows_approver ON approval_workflows(approver_id);
```

### ✅ 3. Tabel `proposal_documents` (Optional)

Untuk menyimpan dokumen pendukung:

```sql
CREATE TABLE proposal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL,
    document_type VARCHAR(50), -- 'RAB', 'TOR', 'Surat Permohonan', etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT, -- dalam bytes
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_proposal_documents_proposal ON proposal_documents(proposal_id);
```

### ✅ 4. Tabel `proposal_revisions` (Optional)

Untuk tracking revisi/perubahan:

```sql
CREATE TABLE proposal_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL,
    revised_by UUID NOT NULL,
    revision_type ENUM('create', 'update', 'status_change', 'approve', 'reject'),
    old_data JSON, -- Data sebelum perubahan
    new_data JSON, -- Data setelah perubahan
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (revised_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_proposal_revisions_proposal ON proposal_revisions(proposal_id);
```

---

## 🎯 API Endpoints

### **A. Proposal CRUD**

#### [ ] 1.1. Get All Proposals
```
GET /api/proposals
```

**Query Parameters:**
- `status` (optional): Filter by status
- `rkam_id` (optional): Filter by RKAM
- `user_id` (optional): Filter by pengusul
- `page` (optional): Pagination
- `per_page` (optional): Items per page
- `search` (optional): Search by title
- `from_date` (optional): Filter dari tanggal
- `to_date` (optional): Filter sampai tanggal

**Response:**
```json
{
  "success": true,
  "message": "Proposals retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "rkam_id": "uuid",
      "user_id": "uuid",
      "title": "Renovasi Ruang Kelas 1A",
      "description": "Deskripsi lengkap...",
      "jumlah_pengajuan": "15000000.00",
      "status": "submitted",
      "requires_committee_approval": false,
      
      "submitted_at": "2025-11-01T10:00:00Z",
      "verified_at": null,
      "approved_at": null,
      "rejected_at": null,
      
      "created_at": "2025-11-01T09:00:00Z",
      "updated_at": "2025-11-01T10:00:00Z",
      
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "role": "Pengusul"
      },
      "rkam": {
        "id": "uuid",
        "kategori": "Renovasi",
        "item_name": "Renovasi Gedung Sekolah",
        "pagu": "50000000.00",
        "terpakai": "15000000.00",
        "sisa": "35000000.00"
      },
      "current_workflow": {
        "stage": "verification",
        "status": "pending",
        "approver_role": "Verifikator"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 25,
    "last_page": 3
  }
}
```

**Business Logic:**
- Return proposals sesuai role:
  - **Pengusul**: Hanya proposal miliknya
  - **Verifikator**: Proposal dengan status `submitted`
  - **Kepala Madrasah**: Proposal dengan status `verified`
  - **Komite**: Proposal dengan status `approved` dan `requires_committee_approval=true`
  - **Bendahara**: Proposal dengan status `final_approved`
  - **Administrator**: Semua proposal

---

#### [ ] 1.2. Get Single Proposal
```
GET /api/proposals/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal retrieved successfully",
  "data": {
    "id": "uuid",
    "rkam_id": "uuid",
    "user_id": "uuid",
    "title": "Renovasi Ruang Kelas 1A",
    "description": "Deskripsi lengkap...",
    "jumlah_pengajuan": "15000000.00",
    "status": "verified",
    "requires_committee_approval": true,
    
    "submitted_at": "2025-11-01T10:00:00Z",
    "verified_at": "2025-11-02T14:00:00Z",
    "verified_by": "uuid",
    "approved_at": null,
    "rejected_at": null,
    
    "created_at": "2025-11-01T09:00:00Z",
    "updated_at": "2025-11-02T14:00:00Z",
    
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "Pengusul"
    },
    "rkam": {
      "id": "uuid",
      "kategori": "Renovasi",
      "item_name": "Renovasi Gedung Sekolah",
      "pagu": "50000000.00",
      "tahun_anggaran": 2025,
      "terpakai": "15000000.00",
      "sisa": "35000000.00",
      "status": "Normal"
    },
    "verifier": {
      "id": "uuid",
      "full_name": "Jane Smith",
      "role": "Verifikator"
    },
    "workflows": [
      {
        "stage": "verification",
        "sequence": 1,
        "approver_role": "Verifikator",
        "status": "approved",
        "action_at": "2025-11-02T14:00:00Z",
        "notes": "Dokumen lengkap, disetujui",
        "approver": {
          "full_name": "Jane Smith"
        }
      },
      {
        "stage": "principal_approval",
        "sequence": 2,
        "approver_role": "Kepala Madrasah",
        "status": "pending",
        "action_at": null,
        "notes": null
      }
    ],
    "documents": [
      {
        "id": "uuid",
        "document_type": "RAB",
        "file_name": "RAB_Renovasi_Kelas1A.pdf",
        "file_path": "/storage/proposals/uuid/RAB_Renovasi_Kelas1A.pdf",
        "file_size": 524288,
        "uploaded_at": "2025-11-01T09:30:00Z"
      }
    ]
  }
}
```

**Business Logic:**
- Cek authorization: User hanya bisa lihat proposal yang relevan dengan role-nya

---

#### [ ] 1.3. Create Proposal
```
POST /api/proposals
```

**Request Body:**
```json
{
  "rkam_id": "uuid",
  "title": "Renovasi Ruang Kelas 1A",
  "description": "Deskripsi lengkap proposal...",
  "jumlah_pengajuan": 15000000
}
```

**Validation Rules:**
- `rkam_id`: required, exists in rkam table
- `title`: required, string, max:255
- `description`: optional, string
- `jumlah_pengajuan`: required, numeric, min:1

**Business Logic:**
1. Validasi RKAM exists dan aktif
2. Validasi `jumlah_pengajuan` <= `rkam.sisa`
3. Auto-fill `user_id` dari authenticated user
4. Set `status` = 'draft'
5. **Auto-tentukan** `requires_committee_approval`:
   - `true` jika `jumlah_pengajuan` > 50.000.000 (50 juta)
   - `false` jika <= 50 juta
6. Save proposal

**Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "id": "uuid",
    "rkam_id": "uuid",
    "user_id": "uuid",
    "title": "Renovasi Ruang Kelas 1A",
    "description": "Deskripsi lengkap...",
    "jumlah_pengajuan": "15000000.00",
    "status": "draft",
    "requires_committee_approval": false,
    "created_at": "2025-11-01T09:00:00Z"
  }
}
```

---

#### [ ] 1.4. Update Proposal
```
PUT /api/proposals/{id}
```

**Request Body:**
```json
{
  "rkam_id": "uuid",
  "title": "Renovasi Ruang Kelas 1A (Updated)",
  "description": "Deskripsi yang diperbarui...",
  "jumlah_pengajuan": 16000000
}
```

**Business Logic:**
- Hanya bisa update jika `status` = 'draft' atau 'rejected'
- Hanya pengusul (owner) yang bisa update
- Re-validasi budget terhadap RKAM.sisa
- Update `requires_committee_approval` jika jumlah berubah

**Response:**
```json
{
  "success": true,
  "message": "Proposal updated successfully",
  "data": { /* proposal object */ }
}
```

---

#### [ ] 1.5. Delete Proposal
```
DELETE /api/proposals/{id}
```

**Business Logic:**
- Hanya bisa delete jika `status` = 'draft'
- Hanya pengusul (owner) atau Admin yang bisa delete
- Soft delete (set `deleted_at`)

**Response:**
```json
{
  "success": true,
  "message": "Proposal deleted successfully"
}
```

---

### **B. Proposal Actions**

#### [ ] 2.1. Submit Proposal
```
POST /api/proposals/{id}/submit
```

**Business Logic:**
1. Validasi proposal masih `draft`
2. Validasi proposal milik user yang login
3. Update `status` = 'submitted'
4. Set `submitted_at` = now
5. **Buat workflow record**:
   ```php
   ApprovalWorkflow::create([
       'proposal_id' => $proposal->id,
       'stage' => 'verification',
       'sequence' => 1,
       'approver_role' => 'Verifikator',
       'status' => 'pending'
   ]);
   ```
6. **Kirim notifikasi** ke semua user dengan role Verifikator

**Response:**
```json
{
  "success": true,
  "message": "Proposal submitted successfully. Waiting for verification.",
  "data": {
    "id": "uuid",
    "status": "submitted",
    "submitted_at": "2025-11-01T10:00:00Z",
    "next_approver": "Verifikator"
  }
}
```

---

#### [ ] 2.2. Verify Proposal (Verifikator)
```
POST /api/proposals/{id}/verify
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "notes": "Dokumen lengkap dan sesuai ketentuan"
}
```

**Authorization:**
- Hanya role **Verifikator** yang bisa akses

**Business Logic:**

**Jika action = "approve":**
1. Validasi proposal status = 'submitted'
2. Update proposal:
   - `status` = 'verified'
   - `verified_at` = now
   - `verified_by` = authenticated user id
3. Update workflow pertama (verification):
   ```php
   $workflow->update([
       'status' => 'approved',
       'approver_id' => auth()->id(),
       'action_at' => now(),
       'notes' => $request->notes
   ]);
   ```
4. **Buat workflow kedua** (principal approval):
   ```php
   ApprovalWorkflow::create([
       'proposal_id' => $proposal->id,
       'stage' => 'principal_approval',
       'sequence' => 2,
       'approver_role' => 'Kepala Madrasah',
       'status' => 'pending'
   ]);
   ```
5. **Kirim notifikasi** ke Kepala Madrasah

**Jika action = "reject":**
1. Update proposal:
   - `status` = 'rejected'
   - `rejected_at` = now
   - `rejected_by` = authenticated user id
   - `rejection_reason` = notes
2. Update workflow:
   ```php
   $workflow->update([
       'status' => 'rejected',
       'approver_id' => auth()->id(),
       'action_at' => now(),
       'notes' => $request->notes
   ]);
   ```
3. **Kirim notifikasi** ke Pengusul

**Response (Approve):**
```json
{
  "success": true,
  "message": "Proposal verified successfully. Forwarded to Kepala Madrasah.",
  "data": {
    "id": "uuid",
    "status": "verified",
    "verified_at": "2025-11-02T14:00:00Z",
    "next_approver": "Kepala Madrasah"
  }
}
```

**Response (Reject):**
```json
{
  "success": true,
  "message": "Proposal rejected. Pengusul has been notified.",
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejected_at": "2025-11-02T14:00:00Z",
    "rejection_reason": "Dokumen tidak lengkap"
  }
}
```

---

#### [ ] 2.3. Approve Proposal (Kepala Madrasah)
```
POST /api/proposals/{id}/approve
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "notes": "Disetujui untuk dilanjutkan"
}
```

**Authorization:**
- Hanya role **Kepala Madrasah**

**Business Logic:**

**Jika action = "approve":**
1. Validasi proposal status = 'verified'
2. Update proposal:
   - `status` = 'approved'
   - `approved_at` = now
   - `approved_by` = authenticated user id
3. Update workflow kedua (principal_approval):
   ```php
   $workflow->update([
       'status' => 'approved',
       'approver_id' => auth()->id(),
       'action_at' => now(),
       'notes' => $request->notes
   ]);
   ```
4. **Cek `requires_committee_approval`**:
   
   **Jika TRUE** (perlu komite):
   - Buat workflow ketiga:
     ```php
     ApprovalWorkflow::create([
         'proposal_id' => $proposal->id,
         'stage' => 'committee_approval',
         'sequence' => 3,
         'approver_role' => 'Komite Madrasah',
         'status' => 'pending'
     ]);
     ```
   - Kirim notifikasi ke Komite
   
   **Jika FALSE** (tidak perlu komite):
   - Update proposal: `status` = 'final_approved'
   - Set `final_approved_at` = now
   - Set `final_approved_by` = authenticated user id
   - Kirim notifikasi ke Bendahara untuk proses payment

**Jika action = "reject":**
- Same as verification reject logic

**Response (Approve - Perlu Komite):**
```json
{
  "success": true,
  "message": "Proposal approved. Forwarded to Komite Madrasah for final approval.",
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_at": "2025-11-03T10:00:00Z",
    "requires_committee_approval": true,
    "next_approver": "Komite Madrasah"
  }
}
```

**Response (Approve - Tidak Perlu Komite):**
```json
{
  "success": true,
  "message": "Proposal fully approved. Ready for payment processing.",
  "data": {
    "id": "uuid",
    "status": "final_approved",
    "approved_at": "2025-11-03T10:00:00Z",
    "final_approved_at": "2025-11-03T10:00:00Z",
    "requires_committee_approval": false,
    "next_step": "Payment Processing by Bendahara"
  }
}
```

---

#### [ ] 2.4. Final Approve (Komite Madrasah)
```
POST /api/proposals/{id}/final-approve
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "notes": "Disetujui untuk direalisasikan"
}
```

**Authorization:**
- Hanya role **Komite Madrasah**

**Business Logic:**

**Jika action = "approve":**
1. Validasi proposal status = 'approved'
2. Validasi `requires_committee_approval` = true
3. Update proposal:
   - `status` = 'final_approved'
   - `final_approved_at` = now
   - `final_approved_by` = authenticated user id
4. Update workflow ketiga:
   ```php
   $workflow->update([
       'status' => 'approved',
       'approver_id' => auth()->id(),
       'action_at' => now(),
       'notes' => $request->notes
   ]);
   ```
5. **Kirim notifikasi** ke Bendahara untuk proses payment

**Jika action = "reject":**
- Same reject logic

**Response:**
```json
{
  "success": true,
  "message": "Proposal fully approved by committee. Ready for payment processing.",
  "data": {
    "id": "uuid",
    "status": "final_approved",
    "final_approved_at": "2025-11-04T11:00:00Z",
    "next_step": "Payment Processing by Bendahara"
  }
}
```

---

### **C. Dashboard & Statistics**

#### [ ] 3.1. Get Proposal Statistics
```
GET /api/proposals/statistics
```

**Query Parameters:**
- `year` (optional): Filter by year
- `month` (optional): Filter by month

**Response:**
```json
{
  "success": true,
  "data": {
    "total_proposals": 125,
    "by_status": {
      "draft": 10,
      "submitted": 15,
      "verified": 8,
      "approved": 12,
      "rejected": 5,
      "final_approved": 50,
      "completed": 25
    },
    "total_budget_requested": "5250000000.00",
    "total_budget_approved": "4800000000.00",
    "approval_rate": 91.4,
    "avg_approval_time_days": 5.2,
    "pending_actions": {
      "verification": 15,
      "principal_approval": 8,
      "committee_approval": 3
    }
  }
}
```

---

#### [ ] 3.2. Get My Tasks (Approver Dashboard)
```
GET /api/proposals/my-tasks
```

**Response (untuk Verifikator):**
```json
{
  "success": true,
  "message": "Pending tasks retrieved",
  "data": {
    "role": "Verifikator",
    "pending_count": 5,
    "tasks": [
      {
        "proposal_id": "uuid",
        "title": "Renovasi Ruang Kelas 1A",
        "jumlah_pengajuan": "15000000.00",
        "submitted_at": "2025-11-05T09:00:00Z",
        "waiting_days": 2,
        "priority": "normal",
        "user": {
          "full_name": "John Doe"
        }
      }
    ]
  }
}
```

**Business Logic:**
- Return proposals yang menunggu action dari role user saat ini
- Sorted by submitted_at (oldest first)

---

### **D. Upload Documents**

#### [ ] 4.1. Upload Proposal Document
```
POST /api/proposals/{id}/documents
```

**Request (multipart/form-data):**
```
document_type: "RAB"
file: [binary file]
```

**Validation:**
- `document_type`: required, in:['RAB','TOR','Surat Permohonan','Lainnya']
- `file`: required, file, max:10240 (10MB), mimes:pdf,doc,docx,xls,xlsx

**Business Logic:**
1. Validasi proposal exists dan user punya akses
2. Store file ke storage (e.g., `/storage/proposals/{proposal_id}/`)
3. Save metadata ke tabel `proposal_documents`

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "proposal_id": "uuid",
    "document_type": "RAB",
    "file_name": "RAB_Renovasi.pdf",
    "file_path": "/storage/proposals/uuid/RAB_Renovasi.pdf",
    "file_size": 524288,
    "uploaded_at": "2025-11-01T10:30:00Z"
  }
}
```

---

#### [ ] 4.2. Delete Document
```
DELETE /api/proposals/{id}/documents/{documentId}
```

**Business Logic:**
- Hanya pengusul (owner) atau Admin yang bisa delete
- Delete file dari storage
- Delete record dari database

---

### **E. Notifications**

#### [ ] 5.1. Get Notifications
```
GET /api/notifications
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "proposal_submitted",
      "title": "Proposal Baru Menunggu Verifikasi",
      "message": "Proposal 'Renovasi Ruang Kelas 1A' telah disubmit oleh John Doe",
      "data": {
        "proposal_id": "uuid",
        "proposal_title": "Renovasi Ruang Kelas 1A"
      },
      "read_at": null,
      "created_at": "2025-11-05T10:00:00Z"
    }
  ],
  "unread_count": 5
}
```

---

#### [ ] 5.2. Mark as Read
```
POST /api/notifications/{id}/read
```

---

## 🔐 Authorization Matrix

| Endpoint | Pengusul | Verifikator | Kepala | Komite | Bendahara | Admin |
|----------|----------|-------------|--------|--------|-----------|-------|
| GET /proposals | ✅ (own) | ✅ (submitted) | ✅ (verified) | ✅ (approved) | ✅ (final) | ✅ (all) |
| POST /proposals | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| PUT /proposals/:id | ✅ (own+draft) | ❌ | ❌ | ❌ | ❌ | ✅ |
| DELETE /proposals/:id | ✅ (own+draft) | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /proposals/:id/submit | ✅ (own) | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /proposals/:id/verify | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| POST /proposals/:id/approve | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| POST /proposals/:id/final-approve | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## 🧪 Testing Checklist

### **Unit Tests**

#### [ ] Proposal Model Tests
- [ ] Test create proposal dengan RKAM valid
- [ ] Test validasi budget tidak melebihi RKAM.sisa
- [ ] Test auto-set `requires_committee_approval`
- [ ] Test status transitions
- [ ] Test relationships (user, rkam, workflows)

#### [ ] Proposal Controller Tests
- [ ] Test GET all proposals dengan filter
- [ ] Test GET single proposal
- [ ] Test POST create proposal
- [ ] Test PUT update proposal
- [ ] Test DELETE proposal
- [ ] Test authorization untuk setiap role

#### [ ] Approval Workflow Tests
- [ ] Test submit proposal → create verification workflow
- [ ] Test verify approve → create principal workflow
- [ ] Test verify reject → update proposal status
- [ ] Test principal approve (with committee)
- [ ] Test principal approve (without committee)
- [ ] Test committee final approve
- [ ] Test rejection at any stage

### **Integration Tests**

#### [ ] Complete Workflow Tests
- [ ] Test full approval flow (no committee):
  ```
  Create → Submit → Verify → Approve → Final Approved
  ```
- [ ] Test full approval flow (with committee):
  ```
  Create → Submit → Verify → Approve → Committee Approve → Final Approved
  ```
- [ ] Test rejection scenarios:
  - Reject di verification
  - Reject di principal approval
  - Reject di committee
- [ ] Test notification triggers
- [ ] Test RKAM update setelah proposal approved

---

## 📊 Business Rules Summary

### **1. Budget Validation**
```php
if ($proposal->jumlah_pengajuan > $rkam->sisa) {
    throw new ValidationException('Budget exceeds available RKAM');
}
```

### **2. Committee Approval Trigger**
```php
$proposal->requires_committee_approval = ($proposal->jumlah_pengajuan > 50000000);
```

### **3. Status Transition Rules**
```
draft → submitted (only by owner)
submitted → verified/rejected (only by Verifikator)
verified → approved/rejected (only by Kepala Madrasah)
approved → final_approved (auto if no committee, or by Komite)
final_approved → payment_processing (by Bendahara)
payment_processing → completed (after payment)
```

### **4. Edit Rules**
- Proposal hanya bisa diedit jika status = `draft` atau `rejected`
- Proposal hanya bisa dihapus jika status = `draft`

### **5. Notification Rules**
- **Submit**: Notify semua Verifikator
- **Verified**: Notify Kepala Madrasah
- **Approved (with committee)**: Notify Komite
- **Approved (no committee)**: Notify Bendahara
- **Final Approved**: Notify Bendahara
- **Rejected**: Notify Pengusul

---

## 🚀 Implementation Order

### **Phase 1: Database & Models**
1. [ ] Create migrations untuk semua tabel
2. [ ] Create Models (Proposal, ApprovalWorkflow, ProposalDocument)
3. [ ] Setup relationships
4. [ ] Create seeders untuk testing data

### **Phase 2: Basic CRUD**
1. [ ] Implement GET all proposals
2. [ ] Implement GET single proposal
3. [ ] Implement POST create proposal
4. [ ] Implement PUT update proposal
5. [ ] Implement DELETE proposal

### **Phase 3: Approval Workflow**
1. [ ] Implement submit proposal
2. [ ] Implement verify (Verifikator)
3. [ ] Implement approve (Kepala)
4. [ ] Implement final approve (Komite)
5. [ ] Implement rejection logic

### **Phase 4: Document Upload**
1. [ ] Implement upload document
2. [ ] Implement delete document
3. [ ] Setup storage configuration

### **Phase 5: Notifications**
1. [ ] Create notification system
2. [ ] Implement notification triggers
3. [ ] Create notification endpoints

### **Phase 6: Testing**
1. [ ] Write unit tests
2. [ ] Write integration tests
3. [ ] Manual testing dengan Postman

### **Phase 7: Integration with RKAM**
1. [ ] Update RKAM.terpakai ketika proposal approved
2. [ ] Lock RKAM.sisa validation
3. [ ] Create transaction logs

---

## 📝 Notes

### **Penting untuk Diperhatikan:**

1. **Transaction Management**: Gunakan database transaction untuk operasi approval (update proposal + create workflow + send notification)

2. **Concurrent Access**: Handle race condition ketika multiple verifikator/kepala approve di waktu bersamaan

3. **Audit Trail**: Simpan semua perubahan di `proposal_revisions` untuk transparency

4. **Performance**: Index semua foreign keys dan frequently queried columns

5. **Security**: 
   - Validate authorization di setiap endpoint
   - Sanitize file uploads
   - Rate limiting untuk prevent abuse

6. **Notification Queue**: Gunakan queue untuk notification agar tidak blocking

---

## ✅ Definition of Done

Proposal & Approval Workflow dianggap selesai jika:

- ✅ Semua endpoint berfungsi sesuai spesifikasi
- ✅ Authorization matrix diimplementasi dengan benar
- ✅ Validation rules berjalan sempurna
- ✅ Workflow transitions sesuai business logic
- ✅ Notification system berfungsi
- ✅ Document upload/download berfungsi
- ✅ Unit tests coverage > 80%
- ✅ Integration tests untuk full workflow passed
- ✅ Manual testing dengan berbagai role berhasil
- ✅ API documentation (Postman/Swagger) lengkap

---

**Good luck dengan implementasi backend! 🚀**
