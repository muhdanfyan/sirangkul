# API Reference - SiRangkul

> **Dokumen Konsolidasi**: Referensi lengkap API endpoints  
> **Base URL**: `http://127.0.0.1:8000/api`  
> **Auth**: Bearer Token (Sanctum)

---

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sirangkul.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "1|abcdefghijklmnop...",
  "user": {
    "id": "uuid",
    "full_name": "Administrator",
    "role": "administrator"
  }
}
```

---

## Proposals

### List All Proposals

```http
GET /api/proposals
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: Filter by status
- `rkam_id`: Filter by RKAM
- `search`: Search by title
- `page`, `per_page`: Pagination

### Get Proposal Detail

```http
GET /api/proposals/{id}
```

### Create Proposal

```http
POST /api/proposals
Content-Type: application/json

{
  "rkam_id": "uuid",
  "title": "Renovasi Ruang Kelas",
  "description": "Deskripsi...",
  "jumlah_pengajuan": 15000000
}
```

### Submit Proposal

```http
POST /api/proposals/{id}/submit
```

### Verify Proposal (Verifikator)

```http
POST /api/proposals/{id}/verify
Content-Type: application/json

{
  "action": "approve",
  "notes": "Dokumen lengkap"
}
```

### Approve Proposal (Kepala/Komite)

```http
POST /api/proposals/{id}/approve
Content-Type: application/json

{
  "action": "approve",
  "notes": "Disetujui"
}
```

### Reject Proposal

```http
POST /api/proposals/{id}/reject
Content-Type: application/json

{
  "rejection_reason": "Anggaran tidak sesuai"
}
```

### My Proposals (Pengusul)

```http
GET /api/proposals/my-proposals
```

### Proposal Statistics

```http
GET /api/proposals/statistics
```

**Response:**
```json
{
  "total": 25,
  "draft": 5,
  "submitted": 3,
  "verified": 2,
  "approved": 1,
  "final_approved": 4,
  "rejected": 2,
  "completed": 8,
  "total_amount_completed": 150000000
}
```

---

## RKAM

### List All RKAM

```http
GET /api/rkam
```

**Query Parameters:**
- `kategori`: Filter by category (Renovasi, Pengadaan, Pelatihan, Operasional)
- `tahun_anggaran`: Filter by year
- `search`: Search by item name

**Response:**
```json
[
  {
    "id": "uuid",
    "kategori": "Renovasi",
    "item_name": "Renovasi Gedung",
    "pagu": "50000000.00",
    "tahun_anggaran": 2025,
    "terpakai": "15000000.00",
    "sisa": "35000000.00",
    "persentase": 30,
    "status": "Normal"
  }
]
```

### Get RKAM Detail

```http
GET /api/rkam/{id}
```

### Create RKAM

```http
POST /api/rkam
Content-Type: application/json

{
  "kategori": "Renovasi",
  "item_name": "Renovasi Gedung Sekolah",
  "pagu": 50000000,
  "tahun_anggaran": 2025,
  "deskripsi": "Renovasi gedung utama"
}
```

### Update RKAM

```http
PUT /api/rkam/{id}
```

### Delete RKAM

```http
DELETE /api/rkam/{id}
```

### Get RKAM Proposals

```http
GET /api/rkam/{id}/proposals
```

---

## Payments

### List All Payments

```http
GET /api/payments
```

### Get Pending Payments

```http
GET /api/payments/pending
```

Returns proposals with status `final_approved` that don't have payment yet.

### Get Payment Detail

```http
GET /api/payments/{id}
```

### Process Payment (Start)

```http
POST /api/payments/{proposalId}/process
Content-Type: application/json

{
  "recipient_name": "CV. Teknologi Maju",
  "recipient_account": "1234567890",
  "bank_name": "BCA",
  "payment_method": "transfer",
  "payment_reference": "TRF20251106001",
  "notes": "Pembayaran untuk pengadaan"
}
```

### Complete Payment

```http
POST /api/payments/{id}/complete
Content-Type: application/json

{
  "payment_proof_url": "https://example.com/bukti.pdf",
  "admin_notes": "Dana sudah dicairkan"
}
```

**With File Upload:**
```http
POST /api/payments/{id}/complete
Content-Type: multipart/form-data

payment_proof_file: [file]
admin_notes: "Dana sudah dicairkan"
```

### Cancel Payment

```http
POST /api/payments/{id}/cancel
Content-Type: application/json

{
  "reason": "Dokumen tidak lengkap"
}
```

### Download Payment Proof

```http
GET /api/payments/{id}/download-proof
```

Returns file as binary stream.

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@sirangkul.com | password |
| Pengusul | pengusul@sirangkul.com | password |
| Verifikator | verifikator@sirangkul.com | password |
| Kepala Madrasah | kepala@sirangkul.com | password |
| Komite Madrasah | komite@sirangkul.com | password |
| Bendahara | bendahara@sirangkul.com | password |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Sample Data

### RKAM Categories

- Renovasi
- Pengadaan
- Pelatihan
- Operasional

### Proposal Status

- draft
- submitted
- verified
- approved
- rejected
- final_approved
- payment_processing
- completed

### Payment Status

- pending
- processing
- completed
- failed

### Payment Methods

- transfer
- cash
- check

---

*Dokumentasi ini dikonsolidasi dari: api-doc.md, PROPOSAL_API_IMPLEMENTATION_SUMMARY.md, RKAM_API_TEST.md, SAMPLE_RKAM_DATA.md*
