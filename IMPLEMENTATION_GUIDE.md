# 🚀 Implementation Guide - Auto Final Approve Fix

## 📋 Overview

Karena ini adalah **frontend repository**, backend Laravel ada di folder terpisah. Berikut adalah langkah-langkah untuk implementasi fix:

---

## ⚡ Quick Fix (Immediate Solution)

### **Option 1: Via Database Tool (Recommended)**

1. **Buka pgAdmin / DBeaver / TablePlus**
2. **Connect ke database `sirangkul_db`**
3. **Run SQL script:** [`QUICK_FIX_STUCK_PROPOSALS.sql`](./QUICK_FIX_STUCK_PROPOSALS.sql)

**Hasil yang diharapkan:**
```
✅ 1 row updated (proposal ID: 2865ac6b-19d3-429e-afc2-2ca92ce9b278)
✅ Status: approved → final_approved
✅ final_approved_at: filled
✅ final_approved_by: filled
```

---

### **Option 2: Via Laravel Tinker**

```bash
cd /path/to/backend-laravel
php artisan tinker
```

```php
// Fix proposal yang stuck
$proposal = \App\Models\Proposal::find('2865ac6b-19d3-429e-afc2-2ca92ce9b278');

$proposal->status = 'final_approved';
$proposal->final_approved_at = $proposal->approved_at;
$proposal->final_approved_by = $proposal->approved_by;
$proposal->save();

// Verify
dump($proposal->only(['id', 'status', 'final_approved_at', 'final_approved_by']));
```

**Expected Output:**
```php
[
  "id" => "2865ac6b-19d3-429e-afc2-2ca92ce9b278"
  "status" => "final_approved"
  "final_approved_at" => "2025-11-06 08:22:03"
  "final_approved_by" => "a1b2c3d4-e5f6-7890-1234-567890abcde3"
]
```

---

### **Option 3: Via API (If backend has endpoint)**

```bash
# Jika backend punya endpoint untuk manual fix
curl -X PATCH "http://127.0.0.1:8000/api/proposals/2865ac6b-19d3-429e-afc2-2ca92ce9b278/final-approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔧 Permanent Fix (Backend Implementation)

### **Step 1: Locate Backend Files**

Cari folder backend Laravel (biasanya terpisah dari frontend):
```bash
# Cari ProposalController
find . -name "ProposalController.php" -type f

# Cari Proposal Model
find . -name "Proposal.php" -path "*/Models/*" -type f
```

**Common locations:**
- `backend/app/Http/Controllers/ProposalController.php`
- `backend/app/Models/Proposal.php`
- `api/app/Http/Controllers/ProposalController.php`
- `laravel/app/Http/Controllers/ProposalController.php`

---

### **Step 2: Update ProposalController.php**

**File:** `app/Http/Controllers/ProposalController.php`

**Cari method:** `approve()`

**Replace dengan code ini:**

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

### **Step 3: Update Proposal.php Model**

**File:** `app/Models/Proposal.php`

**Tambahkan method `boot()` dan relationship `payment()`:**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Proposal extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'rkam_id',
        'title',
        'description',
        'jumlah_pengajuan',
        'status',
        'requires_committee_approval',
        // ... other fields
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

    /**
     * Get the user that owns the proposal
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the RKAM that the proposal belongs to
     */
    public function rkam()
    {
        return $this->belongsTo(RKAM::class);
    }

    /**
     * Get the payment record for this proposal
     */
    public function payment()
    {
        return $this->hasOne(Payment::class, 'proposal_id', 'id');
    }

    // ... other relationships and methods
}
```

---

### **Step 4: Clear Cache**

```bash
cd /path/to/backend-laravel

# Clear all caches
php artisan optimize:clear

# Or individually
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

---

### **Step 5: Restart Backend Server**

```bash
# Kill existing server
# Ctrl+C

# Restart
php artisan serve --host=127.0.0.1 --port=8000
```

---

## 🧪 Testing

### **Test 1: Fix Data yang Stuck (Quick Fix)**

1. **Run SQL fix** atau **Tinker command** di atas
2. **Refresh frontend** → Payment Management page
3. **Check console log:**
   ```javascript
   ✅ Payment data loaded: {
     pendingProposals: [
       {
         id: "2865ac6b-19d3-429e-afc2-2ca92ce9b278",
         title: "testing by aran",
         status: "final_approved",
         jumlah_pengajuan: "30000000.00"
       }
     ],
     pendingCount: 1
   }
   ```

4. **Verify UI:**
   - Tabel "Proposal Perlu Dibayar" menampilkan proposal
   - Badge status: "final_approved" (hijau)
   - Tombol "Proses Pembayaran" muncul

---

### **Test 2: Proposal Baru < 50M (Auto Final Approve)**

1. **Login sebagai Pengusul**
2. **Buat proposal baru:**
   - Title: "Test Auto Final Approve"
   - Budget: **Rp 30.000.000** (< 50M)
3. **Submit proposal**
4. **Login sebagai Verifikator → Verify**
5. **Login sebagai Kepala Madrasah → Approve**
6. **Check response API:**
   ```json
   {
     "success": true,
     "data": {
       "status": "final_approved",     // ✅ Auto
       "final_approved_at": "...",     // ✅ Filled
       "final_approved_by": "...",     // ✅ Filled
       "next_approver": "Bendahara"    // ✅ Skip Komite
     }
   }
   ```
7. **Login sebagai Bendahara → Payment Management**
8. **Verify:** Proposal langsung muncul (tidak perlu Komite)

---

### **Test 3: Proposal Baru > 50M (Need Committee)**

1. **Buat proposal baru:**
   - Title: "Test Committee Approval"
   - Budget: **Rp 75.000.000** (> 50M)
2. **Submit → Verify → Approve by Kepala**
3. **Check response:**
   ```json
   {
     "success": true,
     "data": {
       "status": "approved",           // ✅ NOT final_approved
       "final_approved_at": null,      // ✅ Still null
       "next_approver": "Komite Madrasah" // ✅ Need Komite
     }
   }
   ```
4. **Verify:** Proposal TIDAK muncul di Payment Management
5. **Login sebagai Komite Madrasah → Approve**
6. **Check:** Status → `final_approved`
7. **Verify:** Proposal NOW muncul di Payment Management

---

## ✅ Verification Checklist

Setelah implementasi, verify dengan checklist ini:

- [ ] **Quick Fix berhasil:**
  - [ ] Proposal ID `2865ac6b-19d3-429e-afc2-2ca92ce9b278` status = `final_approved`
  - [ ] Muncul di Payment Management
  - [ ] Tombol "Proses Pembayaran" aktif

- [ ] **Backend code updated:**
  - [ ] `ProposalController::approve()` method updated
  - [ ] `Proposal::boot()` method added
  - [ ] `Proposal::payment()` relationship added

- [ ] **Auto Final Approve works:**
  - [ ] Proposal < 50M langsung `final_approved` setelah Kepala approve
  - [ ] `requires_committee_approval = false` auto-set
  - [ ] `final_approved_at` dan `final_approved_by` terisi

- [ ] **Committee Approval still works:**
  - [ ] Proposal > 50M masih butuh Komite
  - [ ] `requires_committee_approval = true` auto-set
  - [ ] Status `approved` → `final_approved` setelah Komite approve

- [ ] **Payment Management works:**
  - [ ] Endpoint `/api/payments/pending` return proposal dengan status `final_approved`
  - [ ] Frontend menampilkan proposal yang benar
  - [ ] Stats "Menunggu Proses" menampilkan jumlah yang benar

---

## 🔍 Troubleshooting

### **Problem: Proposal masih stuck**

**Check:**
```sql
SELECT id, status, final_approved_at 
FROM proposals 
WHERE id = '2865ac6b-19d3-429e-afc2-2ca92ce9b278';
```

**Solution:** Re-run SQL fix atau Tinker command

---

### **Problem: Backend code tidak berubah**

**Check:**
```bash
# Verify file changes
git diff app/Http/Controllers/ProposalController.php
git diff app/Models/Proposal.php
```

**Solution:** 
- Copy-paste code dengan benar
- Clear cache: `php artisan optimize:clear`
- Restart server

---

### **Problem: Frontend masih tidak muncul**

**Check browser console:**
- F12 → Console tab
- Look for: `✅ Payment data loaded:`
- Check `pendingProposals` array

**Solution:**
1. Verify backend endpoint: `curl http://127.0.0.1:8000/api/payments/pending`
2. Check database: `SELECT * FROM proposals WHERE status = 'final_approved'`
3. Verify token Bendahara valid

---

## 📞 Support

**Jika ada masalah:**

1. **Check Laravel log:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Test di Tinker:**
   ```bash
   php artisan tinker
   >>> \App\Models\Proposal::where('status', 'final_approved')->count()
   ```

3. **Check API response:**
   ```bash
   curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:8000/api/payments/pending
   ```

---

**Good luck! 🚀**
