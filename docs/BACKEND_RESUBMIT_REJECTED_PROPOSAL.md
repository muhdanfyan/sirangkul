# Backend: Resubmit Rejected Proposal Feature

## Overview
Ketika proposal dengan status `rejected` di-submit ulang oleh pengusul, sistem harus mereset semua approval workflow dan memulai proses approval dari awal.

## Frontend Changes (Already Implemented)
✅ ProposalDetail.tsx: Added "Ajukan Ulang" button for rejected proposals
✅ MyProposals.tsx: Added edit button for rejected proposals

## Backend Implementation Required

### 1. Update Submit Proposal Endpoint

**File:** `app/Http/Controllers/ProposalController.php`

**Method:** `submitProposal()`

**Current Logic:**
```php
public function submitProposal($id)
{
    $proposal = Proposal::findOrFail($id);
    
    // Check authorization - only owner can submit
    if ($proposal->user_id !== auth()->id()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    // Only allow submit if status is draft
    if ($proposal->status !== 'draft') {
        return response()->json([
            'message' => 'Proposal hanya dapat diajukan jika berstatus draft'
        ], 400);
    }
    
    $proposal->status = 'submitted';
    $proposal->submitted_at = now();
    $proposal->save();
    
    return response()->json([
        'message' => 'Proposal berhasil diajukan',
        'proposal' => $proposal
    ]);
}
```

**NEW LOGIC (Updated):**
```php
public function submitProposal($id)
{
    $proposal = Proposal::findOrFail($id);
    
    // Check authorization - only owner can submit
    if ($proposal->user_id !== auth()->id()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    // Allow submit if status is draft OR rejected
    if (!in_array($proposal->status, ['draft', 'rejected'])) {
        return response()->json([
            'message' => 'Proposal hanya dapat diajukan jika berstatus draft atau rejected'
        ], 400);
    }
    
    // If resubmitting rejected proposal, reset all approval workflow
    if ($proposal->status === 'rejected') {
        $proposal->verified_at = null;
        $proposal->verified_by = null;
        $proposal->approved_at = null;
        $proposal->approved_by = null;
        $proposal->final_approved_at = null;
        $proposal->final_approved_by = null;
        $proposal->rejected_at = null;
        $proposal->rejected_by = null;
        $proposal->rejection_reason = null;
        $proposal->improvement_suggestions = null;
    }
    
    // Set new status and submission timestamp
    $proposal->status = 'submitted';
    $proposal->submitted_at = now();
    $proposal->save();
    
    // Optional: Log activity
    \Log::info('Proposal resubmitted', [
        'proposal_id' => $proposal->id,
        'user_id' => auth()->id(),
        'previous_status' => $proposal->getOriginal('status'),
        'new_status' => 'submitted'
    ]);
    
    return response()->json([
        'message' => $proposal->getOriginal('status') === 'rejected' 
            ? 'Proposal berhasil diajukan ulang' 
            : 'Proposal berhasil diajukan',
        'proposal' => $proposal->fresh() // Return fresh data
    ]);
}
```

### 2. Update Proposal Update/Edit Endpoint

**File:** `app/Http/Controllers/ProposalController.php`

**Method:** `update()`

**Important:** Pastikan ketika pengusul mengedit proposal yang rejected, status tetap rejected sampai dia klik "Ajukan Ulang".

```php
public function update(Request $request, $id)
{
    $proposal = Proposal::findOrFail($id);
    
    // Check authorization
    if ($proposal->user_id !== auth()->id()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    // Only allow edit if status is draft or rejected
    if (!in_array($proposal->status, ['draft', 'rejected'])) {
        return response()->json([
            'message' => 'Proposal hanya dapat diedit jika berstatus draft atau rejected'
        ], 400);
    }
    
    // Validate request
    $validated = $request->validate([
        'rkam_id' => 'required|exists:rkam,id',
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'jumlah_pengajuan' => 'required|numeric|min:0',
    ]);
    
    // Update proposal fields
    $proposal->update($validated);
    
    // Check if proposal requires committee approval
    if ($proposal->jumlah_pengajuan > 50000000) {
        $proposal->requires_committee_approval = true;
    } else {
        $proposal->requires_committee_approval = false;
    }
    
    // IMPORTANT: Status tetap (draft tetap draft, rejected tetap rejected)
    // User harus klik "Ajukan Ulang" untuk mengubah status rejected -> submitted
    
    $proposal->save();
    
    return response()->json([
        'message' => 'Proposal berhasil diperbarui',
        'proposal' => $proposal->fresh()
    ]);
}
```

### 3. Database Fields Needed

Pastikan tabel `proposals` memiliki kolom berikut:
```sql
-- Already should exist from previous migrations
rejected_at TIMESTAMP NULL
rejected_by INTEGER NULL (foreign key to users.id)
rejection_reason TEXT NULL
improvement_suggestions TEXT NULL

-- For audit log (optional but recommended)
resubmission_count INTEGER DEFAULT 0
last_resubmitted_at TIMESTAMP NULL
```

### 4. Optional: Add Resubmission Counter Migration

**File:** `database/migrations/XXXX_XX_XX_add_resubmission_tracking_to_proposals.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->integer('resubmission_count')->default(0)->after('improvement_suggestions');
            $table->timestamp('last_resubmitted_at')->nullable()->after('resubmission_count');
        });
    }

    public function down()
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn(['resubmission_count', 'last_resubmitted_at']);
        });
    }
};
```

Then update submitProposal method to track resubmissions:
```php
if ($proposal->status === 'rejected') {
    // ... reset approval fields ...
    
    // Track resubmission
    $proposal->resubmission_count = ($proposal->resubmission_count ?? 0) + 1;
    $proposal->last_resubmitted_at = now();
}
```

## Testing Checklist

### Frontend Testing
- [x] ✅ Button "Ajukan Ulang" muncul untuk proposal rejected (case-insensitive)
- [x] ✅ Button "Edit Proposal" muncul untuk proposal rejected (case-insensitive)
- [x] ✅ Debug logging untuk troubleshooting button visibility
- [ ] 🔄 Setelah klik "Ajukan Ulang", status berubah ke "submitted"
- [ ] 🔄 Setelah submit ulang, semua saran perbaikan hilang dari tampilan
- [ ] 🔄 Workflow approval dimulai dari awal (verifikator)

### Backend Testing
- [ ] POST `/api/proposals/{id}/submit` dengan status `rejected` → berhasil
- [ ] Response message: "Proposal berhasil diajukan ulang"
- [ ] Status berubah dari `rejected` → `submitted` (lowercase konsisten)
- [ ] Field `rejected_at`, `rejected_by`, `rejection_reason`, `improvement_suggestions` di-reset ke NULL
- [ ] Field `verified_at`, `approved_at`, `final_approved_at` di-reset ke NULL
- [ ] Field `submitted_at` diupdate ke timestamp sekarang
- [ ] Approval workflow dimulai dari verifikator

### ⚠️ CRITICAL: Status Consistency
**Backend MUST return status in lowercase** untuk konsistensi dengan frontend!

Backend response saat ini mengembalikan:
```json
{
  "status": "rejected",  // ✅ CORRECT (lowercase)
  "status_label": "Rejected"  // ✅ OK untuk display
}
```

❌ JANGAN kirim status dengan huruf kapital:
```json
{
  "status": "Rejected"  // ❌ WRONG - akan break frontend checks
}
```

Frontend sekarang menggunakan `.toLowerCase()` untuk semua status comparison, tetapi lebih baik backend konsisten kirim lowercase dari awal.

### API Testing with Postman/curl

**1. Submit Rejected Proposal**
```bash
curl -X POST http://127.0.0.1:8000/api/proposals/{proposal_id}/submit \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Proposal berhasil diajukan ulang",
  "proposal": {
    "id": "...",
    "status": "submitted",
    "submitted_at": "2026-02-10T12:34:56.000000Z",
    "rejected_at": null,
    "rejected_by": null,
    "rejection_reason": null,
    "improvement_suggestions": null,
    "verified_at": null,
    "approved_at": null,
    "final_approved_at": null,
    "resubmission_count": 1,
    "last_resubmitted_at": "2026-02-10T12:34:56.000000Z"
  }
}
```

**2. Edit Rejected Proposal**
```bash
curl -X PUT http://127.0.0.1:8000/api/proposals/{proposal_id} \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rkam_id": "...",
    "title": "Updated Title",
    "description": "Updated description after rejection",
    "jumlah_pengajuan": 30000000
  }'
```

**Expected Response:**
```json
{
  "message": "Proposal berhasil diperbarui",
  "proposal": {
    "id": "...",
    "status": "rejected",  // Status tetap rejected sampai user submit ulang
    "title": "Updated Title",
    "description": "Updated description after rejection",
    "jumlah_pengajuan": "30000000",
    "rejection_reason": "Masih ada dari penolakan sebelumnya",
    "improvement_suggestions": "Masih ada dari penolakan sebelumnya"
  }
}
```

## Business Rules

1. **Edit Permission:**
   - Pengusul dapat mengedit proposal dengan status `draft` atau `rejected`
   - Proposal dengan status lain tidak dapat diedit

2. **Submit Permission:**
   - Pengusul dapat submit proposal dengan status `draft` atau `rejected`
   - Proposal dengan status lain tidak dapat di-submit ulang

3. **Approval Reset:**
   - Ketika rejected proposal di-submit ulang, SEMUA approval workflow di-reset:
     - `verified_at`, `verified_by` → NULL
     - `approved_at`, `approved_by` → NULL
     - `final_approved_at`, `final_approved_by` → NULL
     - `rejected_at`, `rejected_by` → NULL
     - `rejection_reason` → NULL
     - `improvement_suggestions` → NULL

4. **Status Flow:**
   ```
   rejected → (edit) → rejected → (submit) → submitted → verified → approved → ...
   ```

5. **Resubmission Counter (Optional):**
   - Track berapa kali proposal di-reject dan di-resubmit
   - Berguna untuk analytics dan reporting

## Notification Considerations (Future Enhancement)

Ketika proposal di-resubmit:
1. Kirim notifikasi ke verifikator bahwa ada proposal baru (resubmission)
2. Email ke verifikator dengan subject: "Proposal Diajukan Ulang - {title}"
3. Dashboard verifikator menampilkan badge "Resubmission" untuk proposal yang pernah ditolak

## Security Considerations

1. Validasi authorization: hanya owner proposal yang bisa edit dan submit ulang
2. Validasi status: cegah submit proposal yang sudah approved
3. Audit log: catat semua resubmission untuk tracking
4. Rate limiting: cegah spam resubmission (misalnya max 5x per hari)

## Migration Command

```bash
# Run migration
php artisan migrate

# If needed, rollback and re-migrate
php artisan migrate:rollback --step=1
php artisan migrate
```

## Summary

Frontend sudah siap! Backend perlu:
1. ✅ Update `submitProposal()` untuk handle status `rejected`
2. ✅ Reset semua approval fields ketika resubmit
3. ✅ Update message response untuk resubmission
4. ⚠️ Optional: Tambah counter resubmission untuk tracking

Setelah backend diupdate, pengusul bisa:
1. Lihat proposal rejected dengan rejection reason & improvement suggestions
2. Klik "Edit Proposal" → ubah data proposal
3. Klik "Ajukan Ulang" → proposal kembali ke workflow approval dari awal
