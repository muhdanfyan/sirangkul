# 🔧 Backend Auto Final Approve Fix

## ❌ Masalah Saat Ini

**Proposal dengan budget < 50 juta tidak otomatis final_approved setelah Kepala Madrasah approve.**

### Gejala:
- Proposal budget 30 juta (< 50 juta)
- `requires_committee_approval = false` ✅
- Kepala Madrasah sudah approve ✅
- Status masih **`approved`** ❌ (harusnya `final_approved`)
- `final_approved_at = null` ❌
- `final_approved_by = null` ❌
- **Tidak muncul di Payment Management** ❌

### Data Example (Bug):
```json
{
  "id": "2865ac6b-19d3-429e-afc2-2ca92ce9b278",
  "jumlah_pengajuan": "30000000.00",  // < 50M
  "status": "approved",                // ❌ STUCK
  "requires_committee_approval": false,
  "approved_at": "2025-11-06T08:22:03.000000Z",
  "approved_by": "a1b2c3d4-e5f6-7890-1234-567890abcde3",
  "final_approved_at": null,           // ❌ Should be filled
  "final_approved_by": null            // ❌ Should be filled
}
```

---

## ✅ TODO Backend - Auto Final Approve

### 📍 **File: `app/Http/Controllers/ProposalController.php`**

#### **Method: `approve()`**

**CURRENT CODE (Bug):**
```php
public function approve(Request $request, $id)
{
    $proposal = Proposal::findOrFail($id);
    
    // Authorization check
    if (!$request->user()->hasRole(['Kepala Madrasah', 'Komite Madrasah'])) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }

    // Validate status
    if ($proposal->status !== 'verified') {
        return response()->json([
            'success' => false,
            'message' => 'Proposal can only be approved from verified status'
        ], 400);
    }

    // Update proposal
    $proposal->status = 'approved';
    $proposal->approved_at = now();
    $proposal->approved_by = $request->user()->id;
    $proposal->save();

    // ❌ MISSING: Auto final approve logic!

    return response()->json([
        'success' => true,
        'message' => 'Proposal approved successfully',
        'data' => [
            'id' => $proposal->id,
            'status' => $proposal->status,
            'approved_at' => $proposal->approved_at,
            'approved_by' => $proposal->approved_by
        ]
    ]);
}
```

**FIX - UPDATE JADI:**
```php
public function approve(Request $request, $id)
{
    $proposal = Proposal::findOrFail($id);
    
    // Authorization check
    $user = $request->user();
    $userRole = $user->role;
    
    // Only Kepala Madrasah can do first approval
    if ($proposal->status === 'verified' && $userRole !== 'Kepala Madrasah') {
        return response()->json([
            'success' => false,
            'message' => 'Only Kepala Madrasah can approve verified proposals'
        ], 403);
    }
    
    // Only Komite Madrasah can do final approval for high-value proposals
    if ($proposal->status === 'approved' && $userRole !== 'Komite Madrasah') {
        return response()->json([
            'success' => false,
            'message' => 'Only Komite Madrasah can give final approval'
        ], 403);
    }

    // Validate status
    if (!in_array($proposal->status, ['verified', 'approved'])) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid proposal status for approval'
        ], 400);
    }

    try {
        \DB::beginTransaction();

        // ✅ FIX: Check if requires committee approval
        if ($proposal->status === 'verified') {
            // First approval by Kepala Madrasah
            $proposal->approved_at = now();
            $proposal->approved_by = $user->id;
            
            // ✅ AUTO FINAL APPROVE if not requires committee
            if (!$proposal->requires_committee_approval) {
                // Auto transition to final_approved
                $proposal->status = 'final_approved';
                $proposal->final_approved_at = now();
                $proposal->final_approved_by = $user->id;
                
                $nextStep = 'Payment processing';
                $nextApprover = 'Bendahara';
                
            } else {
                // Requires committee approval
                $proposal->status = 'approved';
                $nextStep = 'Committee approval';
                $nextApprover = 'Komite Madrasah';
            }
            
        } elseif ($proposal->status === 'approved') {
            // Final approval by Komite Madrasah
            $proposal->status = 'final_approved';
            $proposal->final_approved_at = now();
            $proposal->final_approved_by = $user->id;
            
            $nextStep = 'Payment processing';
            $nextApprover = 'Bendahara';
        }

        $proposal->save();

        \DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Proposal approved successfully',
            'data' => [
                'id' => $proposal->id,
                'status' => $proposal->status,
                'approved_at' => $proposal->approved_at,
                'approved_by' => $proposal->approved_by,
                'final_approved_at' => $proposal->final_approved_at,
                'final_approved_by' => $proposal->final_approved_by,
                'requires_committee_approval' => $proposal->requires_committee_approval,
                'next_approver' => $nextApprover ?? null,
                'next_step' => $nextStep ?? null
            ]
        ]);

    } catch (\Exception $e) {
        \DB::rollBack();
        \Log::error('Error approving proposal: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to approve proposal: ' . $e->getMessage()
        ], 500);
    }
}
```

---

### 📍 **File: `app/Models/Proposal.php`**

#### **Add Observer untuk Auto-set `requires_committee_approval`**

**CURRENT:**
```php
class Proposal extends Model
{
    protected $fillable = [
        'user_id',
        'rkam_id',
        'title',
        'description',
        'jumlah_pengajuan',
        'status',
        // ...
    ];

    // Relationships
    public function user() { ... }
    public function rkam() { ... }
}
```

**ADD OBSERVER METHOD:**
```php
class Proposal extends Model
{
    protected $fillable = [
        'user_id',
        'rkam_id',
        'title',
        'description',
        'jumlah_pengajuan',
        'status',
        'requires_committee_approval',
        // ...
    ];

    /**
     * Boot method - Auto set requires_committee_approval
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-set requires_committee_approval on creating
        static::creating(function ($proposal) {
            if (is_null($proposal->requires_committee_approval)) {
                // Check if budget > 50 million
                $proposal->requires_committee_approval = 
                    floatval($proposal->jumlah_pengajuan) > 50000000;
            }
        });

        // Auto-set requires_committee_approval on updating jumlah_pengajuan
        static::updating(function ($proposal) {
            if ($proposal->isDirty('jumlah_pengajuan')) {
                $proposal->requires_committee_approval = 
                    floatval($proposal->jumlah_pengajuan) > 50000000;
            }
        });
    }

    // Relationships
    public function user() { ... }
    public function rkam() { ... }
    
    /**
     * Get the payment record for this proposal
     */
    public function payment()
    {
        return $this->hasOne(Payment::class, 'proposal_id', 'id');
    }
}
```

---

## 🧪 Testing Backend

### **1. Fix Existing Stuck Proposals (Quick Fix)**

**SQL untuk fix proposal yang sudah stuck:**
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

**Check hasil:**
```sql
SELECT 
    id,
    title,
    jumlah_pengajuan,
    status,
    requires_committee_approval,
    approved_at,
    final_approved_at
FROM proposals
WHERE jumlah_pengajuan <= 50000000
ORDER BY approved_at DESC;
```

---

### **2. Test New Approval Flow**

#### **Test Case 1: Proposal < 50M (Auto Final Approve)**

**Step 1: Create proposal dengan budget 30M**
```bash
curl -X POST "http://127.0.0.1:8000/api/proposals" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rkam_id": "019a5340-11f3-70c5-b0aa-efc5df310268",
    "title": "Test Proposal 30M",
    "description": "Testing auto final approve",
    "jumlah_pengajuan": 30000000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "requires_committee_approval": false  // ✅ Auto-set
  }
}
```

**Step 2: Submit → Verify → Approve by Kepala**
```bash
# Submit
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/submit" \
  -H "Authorization: Bearer PENGUSUL_TOKEN"

# Verify
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/verify" \
  -H "Authorization: Bearer VERIFIKATOR_TOKEN"

# Approve by Kepala Madrasah
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/approve" \
  -H "Authorization: Bearer KEPALA_TOKEN"
```

**Expected Response dari Approve:**
```json
{
  "success": true,
  "message": "Proposal approved successfully",
  "data": {
    "id": "uuid",
    "status": "final_approved",              // ✅ Auto final_approved
    "approved_at": "2025-11-07T...",
    "approved_by": "kepala-uuid",
    "final_approved_at": "2025-11-07T...",   // ✅ Same as approved_at
    "final_approved_by": "kepala-uuid",      // ✅ Same as approved_by
    "requires_committee_approval": false,
    "next_approver": "Bendahara",            // ✅ Skip komite
    "next_step": "Payment processing"
  }
}
```

**Step 3: Check di Payment Management**
```bash
curl -X GET "http://127.0.0.1:8000/api/payments/pending" \
  -H "Authorization: Bearer BENDAHARA_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Test Proposal 30M",
      "status": "final_approved",  // ✅ Muncul!
      "jumlah_pengajuan": "30000000"
    }
  ]
}
```

---

#### **Test Case 2: Proposal > 50M (Need Committee)**

**Step 1: Create proposal dengan budget 75M**
```bash
curl -X POST "http://127.0.0.1:8000/api/proposals" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rkam_id": "019a5340-11f3-70c5-b0aa-efc5df310268",
    "title": "Test Proposal 75M",
    "description": "Testing committee approval",
    "jumlah_pengajuan": 75000000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "requires_committee_approval": true  // ✅ Auto-set
  }
}
```

**Step 2: Submit → Verify → Approve by Kepala**
```bash
# Approve by Kepala Madrasah
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/approve" \
  -H "Authorization: Bearer KEPALA_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",                    // ✅ NOT final_approved
    "approved_at": "2025-11-07T...",
    "approved_by": "kepala-uuid",
    "final_approved_at": null,               // ✅ Still null
    "final_approved_by": null,               // ✅ Still null
    "requires_committee_approval": true,
    "next_approver": "Komite Madrasah",      // ✅ Need komite
    "next_step": "Committee approval"
  }
}
```

**Step 3: Approve by Komite**
```bash
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/approve" \
  -H "Authorization: Bearer KOMITE_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "final_approved",              // ✅ NOW final_approved
    "final_approved_at": "2025-11-07T...",
    "final_approved_by": "komite-uuid",
    "next_approver": "Bendahara",
    "next_step": "Payment processing"
  }
}
```

**Step 4: Check di Payment Management**
```bash
curl -X GET "http://127.0.0.1:8000/api/payments/pending" \
  -H "Authorization: Bearer BENDAHARA_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Test Proposal 75M",
      "status": "final_approved",  // ✅ Muncul setelah komite approve!
      "jumlah_pengajuan": "75000000"
    }
  ]
}
```

---

### **3. Test dengan Laravel Tinker**

```bash
php artisan tinker
```

```php
// Test 1: Create proposal 30M
$proposal = \App\Models\Proposal::create([
    'user_id' => 'a1b2c3d4-e5f6-7890-1234-567890abcde1',
    'rkam_id' => '019a5340-11f3-70c5-b0aa-efc5df310268',
    'title' => 'Test Auto Final Approve',
    'description' => 'Testing',
    'jumlah_pengajuan' => 30000000,
    'status' => 'draft'
]);

// Check auto-set requires_committee_approval
dump($proposal->requires_committee_approval); // Should be false

// Test 2: Create proposal 75M
$proposal2 = \App\Models\Proposal::create([
    'user_id' => 'a1b2c3d4-e5f6-7890-1234-567890abcde1',
    'rkam_id' => '019a5340-11f3-70c5-b0aa-efc5df310268',
    'title' => 'Test Committee Approve',
    'description' => 'Testing',
    'jumlah_pengajuan' => 75000000,
    'status' => 'draft'
]);

// Check auto-set requires_committee_approval
dump($proposal2->requires_committee_approval); // Should be true
```

---

## 🔍 Debugging Checklist

### ✅ **Check 1: Proposal Status After Kepala Approve**

```sql
-- Cek proposal setelah Kepala Madrasah approve
SELECT 
    id,
    title,
    jumlah_pengajuan,
    requires_committee_approval,
    status,
    approved_at,
    final_approved_at,
    CASE 
        WHEN jumlah_pengajuan <= 50000000 AND status = 'final_approved' THEN '✅ CORRECT'
        WHEN jumlah_pengajuan <= 50000000 AND status = 'approved' THEN '❌ BUG: Should be final_approved'
        WHEN jumlah_pengajuan > 50000000 AND status = 'approved' THEN '✅ CORRECT: Waiting komite'
        ELSE '❓ Unknown'
    END as validation_status
FROM proposals
WHERE approved_at IS NOT NULL
ORDER BY approved_at DESC;
```

---

### ✅ **Check 2: Auto-set requires_committee_approval**

```sql
-- Cek apakah requires_committee_approval di-set dengan benar
SELECT 
    id,
    title,
    jumlah_pengajuan,
    requires_committee_approval,
    CASE 
        WHEN jumlah_pengajuan <= 50000000 AND requires_committee_approval = false THEN '✅ CORRECT'
        WHEN jumlah_pengajuan > 50000000 AND requires_committee_approval = true THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as validation
FROM proposals
ORDER BY created_at DESC
LIMIT 20;
```

---

### ✅ **Check 3: Payment Pending List**

```sql
-- Cek proposal yang seharusnya muncul di Payment Management
SELECT 
    id,
    title,
    jumlah_pengajuan,
    status,
    final_approved_at,
    (SELECT COUNT(*) FROM payments WHERE proposal_id = proposals.id) as has_payment
FROM proposals
WHERE status = 'final_approved'
ORDER BY final_approved_at DESC;
```

**Expected:**
- `status = 'final_approved'` ✅
- `has_payment = 0` ✅ (belum diproses)
- Proposal ini harus muncul di `/api/payments/pending`

---

## 📋 Implementation Steps

### **Step 1: Backup Database**
```bash
# PostgreSQL
pg_dump -U postgres sirangkul_db > backup_before_fix.sql

# Or using Laravel
php artisan db:backup
```

### **Step 2: Fix Existing Data**
```sql
-- Run SQL fix untuk proposal yang stuck
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

### **Step 3: Update Proposal Model**
```bash
# Edit file
nano app/Models/Proposal.php

# Add boot() method dengan observer
# Add payment() relationship
```

### **Step 4: Update ProposalController**
```bash
# Edit file
nano app/Http/Controllers/ProposalController.php

# Replace approve() method dengan code fix
```

### **Step 5: Clear Cache**
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### **Step 6: Test Approval Flow**
```bash
# Test dengan Postman/Curl
# Buat proposal baru 30M → Submit → Verify → Approve
# Check status harus langsung final_approved
```

### **Step 7: Verify Frontend**
```bash
# Login sebagai Bendahara
# Buka Payment Management
# Proposal harus muncul di tabel "Proposal Perlu Dibayar"
```

---

## 🎯 Expected Result

### **Sebelum Fix:**
```
❌ Proposal 30M: approved → stuck → tidak muncul di Payment
❌ Komite tidak bisa approve (proposal tidak muncul)
```

### **Setelah Fix:**
```
✅ Proposal ≤ 50M: verified → approved + final_approved (AUTO) → Payment
✅ Proposal > 50M: verified → approved → komite approve → final_approved → Payment
✅ Status transition otomatis berdasarkan requires_committee_approval
```

---

## 📊 Workflow Diagram

### **Budget ≤ 50M:**
```
Submit → Verify → [Kepala Approve] → ✨ AUTO FINAL_APPROVED ✨ → Payment
                                     ↓
                          requires_committee_approval = false
                          status = final_approved
                          final_approved_at = approved_at
                          final_approved_by = approved_by
```

### **Budget > 50M:**
```
Submit → Verify → [Kepala Approve] → [Komite Approve] → Payment
                        ↓                     ↓
                  status = approved    status = final_approved
                  next: Komite         next: Bendahara
```

---

## 🚨 Critical Notes

1. **Transaction Safety:**
   - Gunakan `DB::beginTransaction()` dan `DB::commit()`
   - Rollback jika error

2. **Authorization:**
   - Kepala Madrasah: approve dari `verified` → `approved`/`final_approved`
   - Komite Madrasah: approve dari `approved` → `final_approved`

3. **Auto-set Logic:**
   - `requires_committee_approval` di-set saat create/update proposal
   - Based on `jumlah_pengajuan > 50000000`

4. **Status Validation:**
   - Validate current status sebelum approve
   - Prevent invalid status transitions

---

## 🔧 Troubleshooting

### **Problem: Proposal masih stuck setelah fix**

**Solution:**
```bash
# Check Laravel log
tail -f storage/logs/laravel.log

# Test di Tinker
php artisan tinker
>>> $proposal = \App\Models\Proposal::find('your-id');
>>> $proposal->approve($user);
```

### **Problem: Error "Call to undefined method"**

**Solution:**
- Pastikan `boot()` method benar
- Clear cache: `php artisan optimize:clear`

### **Problem: Frontend masih tidak muncul**

**Solution:**
1. Check backend endpoint: `/api/payments/pending`
2. Verify proposal status di database: `SELECT status FROM proposals WHERE id = 'xxx'`
3. Check relationship `payment()` di Proposal model

---

## ✅ Success Criteria

- ✅ Proposal ≤ 50M auto `final_approved` setelah Kepala approve
- ✅ `final_approved_at` dan `final_approved_by` terisi otomatis
- ✅ Proposal langsung muncul di Payment Management (tidak perlu Komite)
- ✅ Proposal > 50M masih perlu approval Komite
- ✅ `requires_committee_approval` auto-set saat create proposal
- ✅ No stuck proposals in database

---

**Created:** 2025-11-07  
**For:** SIRANGKUL Auto Final Approve Fix  
**Priority:** 🔥 CRITICAL - Blocking payment workflow
