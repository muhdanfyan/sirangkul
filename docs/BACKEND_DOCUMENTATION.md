# Backend Documentation - SiRangkul

> **Dokumen Konsolidasi**: Gabungan dari semua dokumentasi backend  
> **Tanggal**: November 2025  
> **Backend**: Laravel API  
> **Database**: PostgreSQL

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Proposal Workflow](#proposal-workflow)
3. [RKAM Management](#rkam-management)
4. [Payment Management](#payment-management)
5. [Authorization & Fixes](#authorization--fixes)
6. [API Endpoints Quick Reference](#api-endpoints-quick-reference)

---

## Database Schema

### Tabel `proposals`

```sql
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rkam_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    jumlah_pengajuan DECIMAL(15,2) NOT NULL,
    
    status ENUM('draft', 'submitted', 'verified', 'approved', 'rejected', 
                'final_approved', 'payment_processing', 'completed') DEFAULT 'draft',
    
    submitted_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    verified_by UUID NULL,
    approved_at TIMESTAMP NULL,
    approved_by UUID NULL,
    rejected_at TIMESTAMP NULL,
    rejected_by UUID NULL,
    rejection_reason TEXT NULL,
    final_approved_at TIMESTAMP NULL,
    final_approved_by UUID NULL,
    completed_at TIMESTAMP NULL,
    requires_committee_approval BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rkam_id) REFERENCES rkam(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabel `rkam`

```sql
CREATE TABLE rkam (
    id UUID PRIMARY KEY,
    kategori VARCHAR(100),  -- Renovasi, Pengadaan, Pelatihan, Operasional
    item_name VARCHAR(255),
    pagu DECIMAL(15,2),
    tahun_anggaran INTEGER,
    deskripsi TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Tabel `payments`

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    proposal_id UUID NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_account VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    payment_method ENUM('transfer', 'cash', 'check') DEFAULT 'transfer',
    payment_reference VARCHAR(100),
    payment_proof_url VARCHAR(500),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    processed_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);
```

---

## Proposal Workflow

### Alur Persetujuan

```
Pengusul (Create) 
  ↓
Verifikator (Verify) 
  ↓
Kepala Madrasah (Approve)
  ↓
[Jika > 50 Juta] Komite Madrasah (Final Approve)
  ↓
Bendahara (Payment Processing)
```

### Status Transitions

| From | To | Actor | Condition |
|------|-----|-------|-----------|
| draft | submitted | Pengusul | Submit proposal |
| submitted | verified | Verifikator | Approve verification |
| submitted | rejected | Verifikator | Reject dengan alasan |
| verified | approved | Kepala Madrasah | Approve (jika > 50M) |
| verified | final_approved | Kepala Madrasah | Approve (jika ≤ 50M, auto) |
| approved | final_approved | Komite Madrasah | Final approve |
| approved | rejected | Komite Madrasah | Reject |
| final_approved | payment_processing | Bendahara | Start payment |
| payment_processing | completed | Bendahara | Complete payment |

### Auto Final Approve Logic

Proposal dengan budget ≤ Rp 50.000.000 akan **otomatis** mendapat status `final_approved` setelah Kepala Madrasah approve, tanpa perlu persetujuan Komite.

```php
// Di ProposalController::approve()
if (!$proposal->requires_committee_approval) {
    $proposal->status = 'final_approved';
    $proposal->final_approved_at = now();
    $proposal->final_approved_by = $user->id;
}
```

---

## RKAM Management

### Konsep RKAM

RKAM (Rencana Kegiatan dan Anggaran Madrasah) adalah **Master Budget Tahunan**:
- Dibuat di awal tahun anggaran oleh Admin/Bendahara
- Proposal mengacu ke RKAM (parent-child relationship)
- Proposal tidak boleh melebihi sisa anggaran RKAM

### Computed Attributes

```php
// Di Model Rkam.php
public function getTerpakaiAttribute(): float
{
    return $this->proposals()
        ->whereIn('status', ['approved', 'final_approved', 'completed'])
        ->sum('jumlah_pengajuan');
}

public function getSisaAttribute(): float
{
    return $this->pagu - $this->terpakai;
}

public function getStatusAttribute(): string
{
    $persentase = ($this->terpakai / $this->pagu) * 100;
    if ($persentase >= 90) return 'Critical';
    if ($persentase >= 75) return 'Warning';
    return 'Normal';
}
```

---

## Payment Management

### Payment Flow

```
final_approved → [Proses Pembayaran] → payment_processing → [Selesaikan] → completed
                        ↓
               Update RKAM.terpakai
```

### Complete Payment with RKAM Update

```php
// Di PaymentController::completePayment()
$rkam = $proposal->rkam;
$newTerpakai = (float)$rkam->terpakai + (float)$payment->amount;
$newSisa = (float)$rkam->pagu - $newTerpakai;

$rkam->update([
    'terpakai' => $newTerpakai,
    'sisa' => $newSisa
]);
```

---

## Authorization & Fixes

### Role Mapping

| UI Display | Database Value | Backend Check |
|------------|----------------|---------------|
| Pengusul | `pengusul` | `pengusul` |
| Verifikator | `verifikator` | `verifikator` |
| Kepala Madrasah | `kepala_madrasah` | `kepala_madrasah` |
| Komite Madrasah | `komite` | `komite` |
| Bendahara | `bendahara` | `bendahara` |

**Rules:**
- ✅ Lowercase semua
- ✅ Underscore (_) bukan spasi
- ✅ Trim leading/trailing spaces

### hasRole Method

```php
// Di User.php
public function hasRole($role)
{
    return strtolower(trim($this->role)) === strtolower(trim($role));
}
```

### Fix Stuck Proposals

```sql
-- Fix proposal < 50M yang stuck di status "approved"
UPDATE proposals 
SET 
    status = 'final_approved',
    final_approved_at = approved_at,
    final_approved_by = approved_by
WHERE 
    status = 'approved' 
    AND requires_committee_approval = false
    AND approved_at IS NOT NULL
    AND final_approved_at IS NULL;
```

---

## API Endpoints Quick Reference

### Proposals

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/proposals` | List all proposals | All |
| GET | `/api/proposals/{id}` | Get proposal detail | All |
| POST | `/api/proposals` | Create proposal | Pengusul |
| PUT | `/api/proposals/{id}` | Update proposal | Pengusul |
| DELETE | `/api/proposals/{id}` | Delete proposal | Pengusul |
| POST | `/api/proposals/{id}/submit` | Submit proposal | Pengusul |
| POST | `/api/proposals/{id}/verify` | Verify proposal | Verifikator |
| POST | `/api/proposals/{id}/approve` | Approve proposal | Kepala/Komite |
| POST | `/api/proposals/{id}/reject` | Reject proposal | Verifikator/Kepala/Komite |

### RKAM

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/rkam` | List all RKAM | All |
| GET | `/api/rkam/{id}` | Get RKAM detail | All |
| POST | `/api/rkam` | Create RKAM | Admin/Bendahara |
| PUT | `/api/rkam/{id}` | Update RKAM | Admin/Bendahara |
| DELETE | `/api/rkam/{id}` | Delete RKAM | Admin |
| GET | `/api/rkam/{id}/proposals` | Get proposals for RKAM | All |

### Payments

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/payments` | List all payments | Bendahara |
| GET | `/api/payments/pending` | Get pending proposals | Bendahara |
| GET | `/api/payments/{id}` | Get payment detail | Bendahara |
| POST | `/api/payments/{proposalId}/process` | Start payment | Bendahara |
| POST | `/api/payments/{id}/complete` | Complete payment | Bendahara |
| POST | `/api/payments/{id}/cancel` | Cancel payment | Bendahara |

---

## Common Commands

```bash
# Run migrations
php artisan migrate

# Run seeder
php artisan db:seed --class=RkamSeeder

# Clear cache
php artisan optimize:clear

# Check logs
tail -f storage/logs/laravel.log

# Test in Tinker
php artisan tinker
```

---

*Dokumentasi ini dikonsolidasi dari: BACKEND_TODO.md, BACKEND_PROPOSAL_TODO.md, BACKEND_PAYMENT_TODO.md, BACKEND_RKAM_TODO.md, BACKEND_AUTHORIZATION_FIX.md, BACKEND_AUTO_FINAL_APPROVE_FIX.md, BACKEND_PAYMENT_PENDING_FIX.md, BACKEND_TODO_PAYMENT_ENHANCEMENT.md*
