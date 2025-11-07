# 📋 Backend TODO - Payment & Proposal Enhancement

## 🚨 Critical Issues to Fix

### 1. **PAYMENT PROOF UPLOAD - Mandatory**
**Priority**: 🔴 HIGH

**Current Problem:**
- Complete payment modal hanya punya input URL text
- Tidak ada validasi apakah URL diisi atau tidak
- Bukti pembayaran tidak wajib diupload

**Backend Changes Required:**

#### **File: `app/Http/Controllers/PaymentController.php`**

**Method: `completePayment()`**

```php
public function completePayment(Request $request, $id)
{
    $request->validate([
        'payment_proof_url' => 'required|url',  // ✅ MAKE IT REQUIRED
        'admin_notes' => 'nullable|string'
    ]);

    // ... rest of the code
}
```

**API Endpoint:** `POST /api/payments/{id}/complete`

**Validation Rules:**
```php
[
    'payment_proof_url' => 'required|url|max:2048',
    'admin_notes' => 'nullable|string|max:1000'
]
```

**Error Response:**
```json
{
  "success": false,
  "message": "The payment proof url field is required.",
  "errors": {
    "payment_proof_url": [
      "The payment proof url field is required."
    ]
  }
}
```

---

### 2. **FILE UPLOAD FOR PAYMENT PROOF**
**Priority**: 🟠 MEDIUM-HIGH

**Current Problem:**
- Hanya support URL, tidak support upload file langsung
- Bendahara harus upload ke tempat lain dulu, baru paste URL

**Backend Enhancement Required:**

#### **Option A: Support Both URL and File Upload**

**Migration:**
```php
// Add column for file path
Schema::table('payments', function (Blueprint $table) {
    $table->string('payment_proof_file')->nullable()->after('payment_proof_url');
});
```

**Controller:**
```php
public function completePayment(Request $request, $id)
{
    $request->validate([
        'payment_proof_url' => 'nullable|url|max:2048',
        'payment_proof_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB
        'admin_notes' => 'nullable|string|max:1000'
    ]);

    // At least one proof is required
    if (empty($request->payment_proof_url) && !$request->hasFile('payment_proof_file')) {
        return response()->json([
            'success' => false,
            'message' => 'Payment proof (URL or file) is required'
        ], 422);
    }

    $payment = Payment::findOrFail($id);

    // Handle file upload
    if ($request->hasFile('payment_proof_file')) {
        $file = $request->file('payment_proof_file');
        $filename = 'payment_' . $payment->id . '_' . time() . '.' . $file->extension();
        $path = $file->storeAs('payment_proofs', $filename, 'public');
        $payment->payment_proof_file = $path;
    }

    // Handle URL
    if ($request->payment_proof_url) {
        $payment->payment_proof_url = $request->payment_proof_url;
    }

    // ... rest of the code
}
```

**Storage Configuration:**
```php
// config/filesystems.php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
],
```

**Symbolic Link:**
```bash
php artisan storage:link
```

---

### 3. **PROPOSAL REJECTION ENDPOINT**
**Priority**: 🔴 HIGH

**Current Problem:**
- Frontend call `apiService.rejectProposal()` but backend might not have proper endpoint
- No clear rejection reason storage
- Rejection flow not tested

**Backend Implementation Required:**

#### **File: `app/Http/Controllers/ProposalController.php`**

**Method: `reject()`**

```php
public function reject(Request $request, $id)
{
    $request->validate([
        'rejection_reason' => 'required|string|max:1000'
    ]);

    $proposal = Proposal::findOrFail($id);
    $user = $request->user();

    // Authorization check - only Verifikator, Kepala, or Komite can reject
    if (!in_array($user->role, ['Verifikator', 'Kepala Madrasah', 'Komite Madrasah'])) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized to reject proposals'
        ], 403);
    }

    // Check if proposal is in rejectable status
    if (!in_array($proposal->status, ['submitted', 'verified', 'approved'])) {
        return response()->json([
            'success' => false,
            'message' => 'Proposal cannot be rejected in current status'
        ], 400);
    }

    try {
        \DB::beginTransaction();

        $proposal->status = 'rejected';
        $proposal->rejection_reason = $request->rejection_reason;
        $proposal->rejected_at = now();
        $proposal->rejected_by = $user->id;
        $proposal->save();

        // Optional: Send notification to Pengusul
        // Notification::send($proposal->user, new ProposalRejectedNotification($proposal));

        \DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Proposal has been rejected',
            'data' => $proposal
        ]);

    } catch (\Exception $e) {
        \DB::rollBack();
        \Log::error('Error rejecting proposal: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to reject proposal: ' . $e->getMessage()
        ], 500);
    }
}
```

**Route:**
```php
// routes/api.php
Route::post('/proposals/{id}/reject', [ProposalController::class, 'reject'])
    ->middleware(['auth:sanctum']);
```

**Migration (if columns missing):**
```php
Schema::table('proposals', function (Blueprint $table) {
    $table->text('rejection_reason')->nullable();
    $table->timestamp('rejected_at')->nullable();
    $table->uuid('rejected_by')->nullable();
});
```

---

### 4. **PROPOSAL LIST FOR PENGUSUL**
**Priority**: 🔴 HIGH

**Current Problem:**
- Pengusul tidak punya view untuk melihat proposal yang sudah completed
- Tidak bisa lihat bukti pembayaran
- Tidak ada detail informasi pembayaran

**Backend Enhancement Required:**

#### **File: `app/Http/Controllers/ProposalController.php`**

**Method: `myProposals()`**

```php
public function myProposals(Request $request)
{
    $user = $request->user();

    // Get all proposals for current user
    $proposals = Proposal::where('user_id', $user->id)
        ->with([
            'rkam:id,kategori,pagu,terpakai,sisa',
            'user:id,name,full_name,email',
            'verifier:id,name,full_name',
            'approver:id,name,full_name',
            'final_approver:id,name,full_name',
            'payment' => function($query) {
                $query->select([
                    'id', 'proposal_id', 'amount', 'recipient_name', 
                    'payment_method', 'payment_proof_url', 'payment_proof_file',
                    'status', 'completed_at', 'processed_at', 'notes', 'admin_notes'
                ]);
            }
        ])
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $proposals
    ]);
}
```

**Route:**
```php
Route::get('/proposals/my-proposals', [ProposalController::class, 'myProposals'])
    ->middleware(['auth:sanctum']);
```

---

### 5. **PROPOSAL DETAIL WITH PAYMENT INFO**
**Priority**: 🟠 MEDIUM

**Current Problem:**
- `getProposalById()` might not include payment information
- Pengusul tidak bisa lihat detail payment dari proposal mereka

**Backend Enhancement:**

```php
public function show($id)
{
    $user = auth()->user();
    
    $proposal = Proposal::with([
        'rkam:id,kategori,pagu,terpakai,sisa',
        'user:id,name,full_name,email',
        'verifier:id,name,full_name',
        'approver:id,name,full_name',
        'final_approver:id,name,full_name',
        'payment' => function($query) {
            $query->select([
                'id', 'proposal_id', 'amount', 'recipient_name', 
                'recipient_account', 'bank_name', 'payment_method', 
                'payment_reference', 'payment_proof_url', 'payment_proof_file',
                'status', 'completed_at', 'processed_at', 'processed_by',
                'notes', 'admin_notes'
            ]);
        },
        'payment.processedByUser:id,name,full_name' // Bendahara yang memproses
    ])->findOrFail($id);

    // Authorization: User can only see their own proposals (unless they're approver)
    if ($user->role === 'Pengusul' && $proposal->user_id !== $user->id) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }

    return response()->json([
        'success' => true,
        'data' => $proposal
    ]);
}
```

---

### 6. **PAYMENT PROOF DOWNLOAD ENDPOINT**
**Priority**: 🟡 LOW-MEDIUM

**Feature:** Allow Pengusul to download payment proof file

```php
public function downloadPaymentProof($paymentId)
{
    $payment = Payment::findOrFail($paymentId);
    $user = auth()->user();

    // Authorization: Only proposal owner or admin can download
    if ($user->role === 'Pengusul' && $payment->proposal->user_id !== $user->id) {
        return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
    }

    if (!$payment->payment_proof_file) {
        return response()->json([
            'success' => false, 
            'message' => 'No payment proof file available'
        ], 404);
    }

    $filePath = storage_path('app/public/' . $payment->payment_proof_file);

    if (!file_exists($filePath)) {
        return response()->json([
            'success' => false, 
            'message' => 'Payment proof file not found'
        ], 404);
    }

    return response()->download($filePath);
}
```

**Route:**
```php
Route::get('/payments/{id}/download-proof', [PaymentController::class, 'downloadPaymentProof'])
    ->middleware(['auth:sanctum']);
```

---

## 🔄 Additional Backend Enhancements

### 7. **NOTIFICATION SYSTEM**
**Priority**: 🟡 MEDIUM

**Features:**
- Notify Pengusul when proposal is rejected
- Notify Pengusul when payment is completed
- Notify Pengusul when payment proof is uploaded

**Implementation:**
```php
// app/Notifications/ProposalRejectedNotification.php
// app/Notifications/PaymentCompletedNotification.php
```

---

### 8. **PAYMENT HISTORY FOR PENGUSUL**
**Priority**: 🟡 MEDIUM

**Endpoint:** `GET /api/payments/my-payments`

```php
public function myPayments(Request $request)
{
    $user = $request->user();

    $payments = Payment::whereHas('proposal', function($query) use ($user) {
        $query->where('user_id', $user->id);
    })
    ->with([
        'proposal:id,title,jumlah_pengajuan,status',
        'processedByUser:id,name,full_name'
    ])
    ->orderBy('created_at', 'desc')
    ->get();

    return response()->json([
        'success' => true,
        'data' => $payments
    ]);
}
```

---

### 9. **PROPOSAL STATISTICS FOR PENGUSUL**
**Priority**: 🟢 LOW

**Endpoint:** `GET /api/proposals/statistics`

```php
public function statistics(Request $request)
{
    $user = $request->user();

    $stats = [
        'total' => Proposal::where('user_id', $user->id)->count(),
        'draft' => Proposal::where('user_id', $user->id)->where('status', 'draft')->count(),
        'submitted' => Proposal::where('user_id', $user->id)->where('status', 'submitted')->count(),
        'verified' => Proposal::where('user_id', $user->id)->where('status', 'verified')->count(),
        'approved' => Proposal::where('user_id', $user->id)->where('status', 'approved')->count(),
        'final_approved' => Proposal::where('user_id', $user->id)->where('status', 'final_approved')->count(),
        'rejected' => Proposal::where('user_id', $user->id)->where('status', 'rejected')->count(),
        'completed' => Proposal::where('user_id', $user->id)->where('status', 'completed')->count(),
        'total_amount_completed' => Proposal::where('user_id', $user->id)
            ->where('status', 'completed')
            ->sum('jumlah_pengajuan')
    ];

    return response()->json([
        'success' => true,
        'data' => $stats
    ]);
}
```

---

## 🧪 Testing Checklist

### **Rejection Endpoint:**
```bash
# Test reject proposal
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/reject" \
  -H "Authorization: Bearer VERIFIKATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "Anggaran tidak sesuai dengan kebutuhan"
  }'
```

### **Complete Payment with Validation:**
```bash
# Test complete without proof (should fail)
curl -X POST "http://127.0.0.1:8000/api/payments/{id}/complete" \
  -H "Authorization: Bearer BENDAHARA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_notes": "Test"
  }'

# Expected: 422 Validation Error
```

### **My Proposals:**
```bash
curl -X GET "http://127.0.0.1:8000/api/proposals/my-proposals" \
  -H "Authorization: Bearer PENGUSUL_TOKEN"
```

### **File Upload:**
```bash
curl -X POST "http://127.0.0.1:8000/api/payments/{id}/complete" \
  -H "Authorization: Bearer BENDAHARA_TOKEN" \
  -F "payment_proof_file=@/path/to/proof.pdf" \
  -F "admin_notes=Payment completed"
```

---

## 📝 Database Migrations Needed

```bash
# 1. Add payment proof file column
php artisan make:migration add_payment_proof_file_to_payments_table

# 2. Add rejection columns if missing
php artisan make:migration add_rejection_fields_to_proposals_table

# Run migrations
php artisan migrate
```

---

## 🔐 Authorization Matrix

| Role | View Own Proposals | View Payment Proof | Download Proof | Reject Proposal |
|------|-------------------|-------------------|----------------|-----------------|
| Pengusul | ✅ | ✅ | ✅ | ❌ |
| Verifikator | ✅ (all) | ✅ (all) | ✅ | ✅ |
| Kepala Madrasah | ✅ (all) | ✅ (all) | ✅ | ✅ |
| Komite Madrasah | ✅ (all) | ✅ (all) | ✅ | ✅ |
| Bendahara | ✅ (all) | ✅ (all) | ✅ | ❌ |

---

## 🚀 Implementation Priority Order

1. ✅ **CRITICAL - Week 1:**
   - Make payment_proof_url REQUIRED in validation
   - Implement reject proposal endpoint
   - Add my-proposals endpoint
   - Add payment info to proposal detail

2. ✅ **HIGH - Week 2:**
   - Add file upload support for payment proof
   - Add download payment proof endpoint
   - Test all rejection flows

3. ✅ **MEDIUM - Week 3:**
   - Add notification system
   - Add statistics endpoint
   - Performance optimization

4. ✅ **LOW - Week 4:**
   - Additional features
   - Documentation
   - Monitoring & logging

---

**Total Estimated Time**: 2-3 weeks for complete implementation

**Files to Modify:**
- `app/Http/Controllers/PaymentController.php`
- `app/Http/Controllers/ProposalController.php`
- `app/Models/Payment.php`
- `app/Models/Proposal.php`
- `routes/api.php`
- `database/migrations/`

**New Files to Create:**
- `app/Notifications/ProposalRejectedNotification.php`
- `app/Notifications/PaymentCompletedNotification.php`
