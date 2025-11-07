# 🧪 PROPOSAL APPROVAL API - Testing Guide

> **Endpoint Base**: `http://127.0.0.1:8000/api`  
> **Authentication**: Bearer Token (Sanctum)

---

## 🔑 Authentication

All requests require authentication header:
```http
Authorization: Bearer {your_token_here}
```

---

## 📝 Test Data Setup

### Required Users (Seeder recommended)
```sql
-- Pengusul
INSERT INTO users (id, full_name, email, password, role) 
VALUES (UUID(), 'Ahmad Pengusul', 'pengusul@madrasah.sch.id', bcrypt('password'), 'Pengusul');

-- Verifikator
INSERT INTO users (id, full_name, email, password, role) 
VALUES (UUID(), 'Siti Verifikator', 'verifikator@madrasah.sch.id', bcrypt('password'), 'Verifikator');

-- Kepala Madrasah
INSERT INTO users (id, full_name, email, password, role) 
VALUES (UUID(), 'Dr. Kepala Madrasah', 'kepala@madrasah.sch.id', bcrypt('password'), 'Kepala Madrasah');

-- Komite Madrasah
INSERT INTO users (id, full_name, email, password, role) 
VALUES (UUID(), 'Bapak Komite', 'komite@madrasah.sch.id', bcrypt('password'), 'Komite Madrasah');

-- Bendahara
INSERT INTO users (id, full_name, email, password, role) 
VALUES (UUID(), 'Ibu Bendahara', 'bendahara@madrasah.sch.id', bcrypt('password'), 'Bendahara');
```

### Required RKAM
```sql
INSERT INTO rkam (id, kategori, item_name, pagu, tahun_anggaran, deskripsi) 
VALUES (UUID(), 'Renovasi', 'Renovasi Gedung Utama', 150000000, 2025, 'Renovasi bangunan kelas');
```

---

## 🧪 Test Scenarios

### Scenario 1: Proposal WITHOUT Committee Approval (< 50M)

#### Step 1: Login as Pengusul
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "pengusul@madrasah.sch.id",
  "password": "password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "1|abcdef...",
    "user": {
      "id": "uuid-here",
      "full_name": "Ahmad Pengusul",
      "email": "pengusul@madrasah.sch.id",
      "role": "Pengusul"
    }
  }
}
```

#### Step 2: Create Proposal (as Pengusul)
```http
POST /api/proposals
Authorization: Bearer {pengusul_token}
Content-Type: application/json

{
  "rkam_id": "uuid-of-rkam",
  "title": "Renovasi Ruang Kelas 7A",
  "description": "Perbaikan lantai, cat dinding, ganti pintu",
  "jumlah_pengajuan": 30000000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "id": "proposal-uuid",
    "rkam_id": "rkam-uuid",
    "user_id": "pengusul-uuid",
    "title": "Renovasi Ruang Kelas 7A",
    "description": "Perbaikan lantai, cat dinding, ganti pintu",
    "jumlah_pengajuan": 30000000,
    "status": "draft",
    "requires_committee_approval": false,
    "status_badge": "gray",
    "status_label": "Draft",
    "next_approver": null,
    "rkam": { ... }
  }
}
```

#### Step 3: Submit Proposal (as Pengusul)
```http
POST /api/proposals/{proposal_id}/submit
Authorization: Bearer {pengusul_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal submitted successfully",
  "data": {
    "id": "proposal-uuid",
    "status": "submitted",
    "submitted_at": "2025-11-06T10:30:00.000000Z",
    "status_badge": "blue",
    "status_label": "Submitted",
    "next_approver": "Verifikator"
  }
}
```

#### Step 4: Login as Verifikator
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "verifikator@madrasah.sch.id",
  "password": "password"
}
```

#### Step 5: Verify Proposal (as Verifikator)
```http
POST /api/proposals/{proposal_id}/verify
Authorization: Bearer {verifikator_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal verified successfully",
  "data": {
    "id": "proposal-uuid",
    "status": "verified",
    "verified_at": "2025-11-06T10:35:00.000000Z",
    "verified_by": "verifikator-uuid",
    "status_badge": "cyan",
    "status_label": "Verified",
    "next_approver": "Kepala Madrasah",
    "verifier": {
      "id": "verifikator-uuid",
      "full_name": "Siti Verifikator"
    }
  }
}
```

#### Step 6: Login as Kepala Madrasah
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "kepala@madrasah.sch.id",
  "password": "password"
}
```

#### Step 7: Approve Proposal (as Kepala Madrasah)
```http
POST /api/proposals/{proposal_id}/approve
Authorization: Bearer {kepala_token}
```

**Expected Response (Auto Final Approved - no committee needed):**
```json
{
  "success": true,
  "message": "Proposal approved successfully",
  "data": {
    "id": "proposal-uuid",
    "status": "final_approved",
    "approved_at": "2025-11-06T10:40:00.000000Z",
    "approved_by": "kepala-uuid",
    "status_badge": "green",
    "status_label": "Final Approved",
    "next_approver": null,
    "approver": {
      "id": "kepala-uuid",
      "full_name": "Dr. Kepala Madrasah"
    }
  }
}
```

---

### Scenario 2: Proposal WITH Committee Approval (> 50M)

#### Step 1-3: Same as Scenario 1

#### Step 4: Create High-Value Proposal (> 50M)
```http
POST /api/proposals
Authorization: Bearer {pengusul_token}
Content-Type: application/json

{
  "rkam_id": "uuid-of-rkam",
  "title": "Renovasi Gedung Utama Komprehensif",
  "description": "Renovasi total gedung utama termasuk struktur, plumbing, electrical",
  "jumlah_pengajuan": 75000000
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "id": "proposal-uuid-2",
    "jumlah_pengajuan": 75000000,
    "status": "draft",
    "requires_committee_approval": true,
    ...
  }
}
```

#### Step 5-7: Submit → Verify → Approve (same as Scenario 1)

#### Step 8: Approve by Kepala Madrasah
```http
POST /api/proposals/{proposal_id}/approve
Authorization: Bearer {kepala_token}
```

**Expected Response (Requires Committee):**
```json
{
  "success": true,
  "message": "Proposal approved successfully",
  "data": {
    "id": "proposal-uuid-2",
    "status": "approved",
    "approved_at": "2025-11-06T11:00:00.000000Z",
    "approved_by": "kepala-uuid",
    "requires_committee_approval": true,
    "status_badge": "purple",
    "status_label": "Approved",
    "next_approver": "Komite Madrasah"
  }
}
```

#### Step 9: Login as Komite Madrasah
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "komite@madrasah.sch.id",
  "password": "password"
}
```

#### Step 10: Final Approve (as Komite)
```http
POST /api/proposals/{proposal_id}/final-approve
Authorization: Bearer {komite_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal final approved successfully",
  "data": {
    "id": "proposal-uuid-2",
    "status": "final_approved",
    "final_approved_at": "2025-11-06T11:10:00.000000Z",
    "final_approved_by": "komite-uuid",
    "status_badge": "green",
    "status_label": "Final Approved",
    "next_approver": null,
    "finalApprover": {
      "id": "komite-uuid",
      "full_name": "Bapak Komite"
    }
  }
}
```

---

### Scenario 3: Rejection Cases

#### Case 3A: Rejection at Verification Stage
```http
POST /api/proposals/{proposal_id}/reject
Authorization: Bearer {verifikator_token}
Content-Type: application/json

{
  "rejection_reason": "Data proposal tidak lengkap. Mohon lampirkan dokumen RAB dan gambar desain."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal rejected",
  "data": {
    "id": "proposal-uuid",
    "status": "rejected",
    "rejected_at": "2025-11-06T10:45:00.000000Z",
    "rejected_by": "verifikator-uuid",
    "rejection_reason": "Data proposal tidak lengkap. Mohon lampirkan dokumen RAB dan gambar desain.",
    "status_badge": "red",
    "status_label": "Rejected",
    "rejector": {
      "id": "verifikator-uuid",
      "full_name": "Siti Verifikator"
    }
  }
}
```

#### Case 3B: Rejection at Approval Stage
```http
POST /api/proposals/{proposal_id}/reject
Authorization: Bearer {kepala_token}
Content-Type: application/json

{
  "rejection_reason": "Anggaran terlalu tinggi. Mohon revisi dan optimalkan biaya."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal rejected",
  "data": {
    "id": "proposal-uuid",
    "status": "rejected",
    "rejected_at": "2025-11-06T11:00:00.000000Z",
    "rejected_by": "kepala-uuid",
    "rejection_reason": "Anggaran terlalu tinggi. Mohon revisi dan optimalkan biaya.",
    "status_badge": "red",
    "status_label": "Rejected"
  }
}
```

---

## ❌ Error Test Cases

### Error 1: Unauthorized Submit (not owner)
```http
POST /api/proposals/{proposal_id}/submit
Authorization: Bearer {different_user_token}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Unauthorized: You can only submit your own proposals"
}
```

### Error 2: Wrong Role for Verify
```http
POST /api/proposals/{proposal_id}/verify
Authorization: Bearer {pengusul_token}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Unauthorized: Only Verifikator can verify proposals"
}
```

### Error 3: Invalid Status Transition
```http
POST /api/proposals/{proposal_id}/approve
Authorization: Bearer {kepala_token}
```

**Expected Response (422) if status is not 'verified':**
```json
{
  "success": false,
  "message": "Cannot approve: Proposal status is 'draft'"
}
```

### Error 4: Missing Rejection Reason
```http
POST /api/proposals/{proposal_id}/reject
Authorization: Bearer {verifikator_token}
Content-Type: application/json

{
  "rejection_reason": ""
}
```

**Expected Response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "rejection_reason": [
      "The rejection reason field is required."
    ]
  }
}
```

### Error 5: Committee Approval Not Required
```http
POST /api/proposals/{proposal_id}/final-approve
Authorization: Bearer {komite_token}
```

**Expected Response (422) if requires_committee_approval = false:**
```json
{
  "success": false,
  "message": "This proposal does not require committee approval"
}
```

### Error 6: Exceed RKAM Budget
```http
POST /api/proposals
Authorization: Bearer {pengusul_token}
Content-Type: application/json

{
  "rkam_id": "uuid-of-rkam",
  "title": "Proposal Melebihi Budget",
  "jumlah_pengajuan": 999999999
}
```

**Expected Response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "jumlah_pengajuan": [
      "Jumlah pengajuan (Rp 999.999.999) melebihi sisa anggaran RKAM (Rp 150.000.000)"
    ]
  }
}
```

---

## 📊 Get Proposal with Full Details

```http
GET /api/proposals/{proposal_id}
Authorization: Bearer {any_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal retrieved successfully",
  "data": {
    "id": "proposal-uuid",
    "rkam_id": "rkam-uuid",
    "user_id": "user-uuid",
    "title": "Renovasi Ruang Kelas 7A",
    "description": "...",
    "jumlah_pengajuan": 30000000,
    "status": "final_approved",
    "requires_committee_approval": false,
    
    "submitted_at": "2025-11-06T10:30:00.000000Z",
    "verified_at": "2025-11-06T10:35:00.000000Z",
    "verified_by": "verifikator-uuid",
    "approved_at": "2025-11-06T10:40:00.000000Z",
    "approved_by": "kepala-uuid",
    "final_approved_at": "2025-11-06T10:40:00.000000Z",
    "final_approved_by": "kepala-uuid",
    
    "status_badge": "green",
    "status_label": "Final Approved",
    "next_approver": null,
    
    "user": {
      "id": "user-uuid",
      "full_name": "Ahmad Pengusul",
      "email": "pengusul@madrasah.sch.id",
      "role": "Pengusul"
    },
    "rkam": {
      "id": "rkam-uuid",
      "kategori": "Renovasi",
      "item_name": "Renovasi Gedung Utama",
      "pagu": 150000000,
      "terpakai": 30000000,
      "sisa": 120000000,
      "persentase": 20.0,
      "status": "Normal"
    },
    "verifier": {
      "id": "verifikator-uuid",
      "full_name": "Siti Verifikator"
    },
    "approver": {
      "id": "kepala-uuid",
      "full_name": "Dr. Kepala Madrasah"
    },
    "attachments": []
  }
}
```

---

## 🔍 Filter Proposals by Status

```http
GET /api/proposals?status=submitted
Authorization: Bearer {verifikator_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposals retrieved successfully",
  "data": [
    {
      "id": "proposal-1",
      "title": "...",
      "status": "submitted",
      "status_badge": "blue",
      "status_label": "Submitted",
      "next_approver": "Verifikator",
      ...
    },
    {
      "id": "proposal-2",
      "title": "...",
      "status": "submitted",
      ...
    }
  ]
}
```

---

## ✅ Testing Checklist

- [ ] **Create proposal < 50M** → requires_committee_approval = false
- [ ] **Create proposal > 50M** → requires_committee_approval = true
- [ ] **Submit as owner** → status changes to submitted
- [ ] **Submit as non-owner** → 403 Unauthorized
- [ ] **Verify as Verifikator** → status changes to verified
- [ ] **Verify as non-Verifikator** → 403 Unauthorized
- [ ] **Approve < 50M** → status changes directly to final_approved
- [ ] **Approve > 50M** → status changes to approved (waiting committee)
- [ ] **Final approve by Komite** → status changes to final_approved
- [ ] **Final approve when not required** → 422 Error
- [ ] **Reject with reason** → status changes to rejected
- [ ] **Reject without reason** → 422 Validation error
- [ ] **View proposal with all relationships** → Shows user, rkam, verifier, approver
- [ ] **Filter by status** → Returns only proposals with matching status
- [ ] **Exceed RKAM budget** → 422 Budget validation error

---

**Happy Testing! 🎉**
