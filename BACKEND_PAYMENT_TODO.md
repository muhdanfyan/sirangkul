# 💰 BACKEND TODO: Payment Management Module

> **Purpose**: Modul pembayaran untuk Bendahara memproses proposal yang sudah final_approved  
> **Flow**: final_approved → payment_processing → completed  
> **Tanggal**: 6 November 2025

---

## 🎯 Business Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPROVAL WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│ draft → submitted → verified → approved → final_approved         │
│                                                ↓                 │
│                                    [MASUK KE PAYMENT]            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     PAYMENT WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Bendahara buka Payment Management                             │
│ 2. Muncul list proposals dengan status 'final_approved'         │
│ 3. Bendahara klik "Proses Pembayaran"                           │
│ 4. Input data pembayaran (rekening, bukti transfer, dll)        │
│ 5. Status proposal → 'payment_processing'                       │
│ 6. Setelah dana dicairkan, klik "Selesaikan Pembayaran"        │
│ 7. Status proposal → 'completed'                                │
│ 8. Update RKAM.terpakai += proposal.jumlah_pengajuan           │
│ 9. Update RKAM.sisa = RKAM.pagu - RKAM.terpakai                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **Tabel: `payments`**

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL UNIQUE,  -- One payment per proposal
    
    -- Payment Info
    amount DECIMAL(15,2) NOT NULL,  -- Sama dengan proposal.jumlah_pengajuan
    recipient_name VARCHAR(255) NOT NULL,  -- Nama penerima
    recipient_account VARCHAR(100) NOT NULL,  -- No. rekening
    bank_name VARCHAR(100),  -- Nama bank
    
    -- Payment Method
    payment_method VARCHAR(50) NOT NULL DEFAULT 'transfer',  -- transfer, cash, check
    payment_reference VARCHAR(100),  -- No. referensi transfer
    
    -- Proof
    payment_proof_url VARCHAR(500),  -- URL bukti transfer (upload file)
    
    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,  -- Catatan dari Bendahara
    
    -- Timestamps
    processed_at TIMESTAMP NULL,  -- Saat mulai diproses
    completed_at TIMESTAMP NULL,  -- Saat selesai dibayarkan
    processed_by UUID,  -- User ID Bendahara yang proses
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_payments_proposal ON payments(proposal_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);
```

---

## 🔧 Implementation Steps

### ✅ Step 1: Migration

**File**: `database/migrations/2025_11_06_create_payments_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('proposal_id')->unique();
            
            // Payment Info
            $table->decimal('amount', 15, 2);
            $table->string('recipient_name', 255);
            $table->string('recipient_account', 100);
            $table->string('bank_name', 100)->nullable();
            
            // Payment Method
            $table->enum('payment_method', ['transfer', 'cash', 'check'])->default('transfer');
            $table->string('payment_reference', 100)->nullable();
            
            // Proof
            $table->string('payment_proof_url', 500)->nullable();
            
            // Status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            
            // Timestamps
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->uuid('processed_by')->nullable();
            
            $table->timestamps();
            
            // Foreign Keys
            $table->foreign('proposal_id')->references('id')->on('proposals')->onDelete('cascade');
            $table->foreign('processed_by')->references('id')->on('users');
            
            // Indexes
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
};
```

**Run Migration:**
```bash
php artisan migrate
```

---

### ✅ Step 2: Payment Model

**File**: `app/Models/Payment.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'proposal_id',
        'amount',
        'recipient_name',
        'recipient_account',
        'bank_name',
        'payment_method',
        'payment_reference',
        'payment_proof_url',
        'status',
        'notes',
        'admin_notes',
        'processed_at',
        'completed_at',
        'processed_by',
    ];
    
    protected $casts = [
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    
    // Payment methods
    const METHOD_TRANSFER = 'transfer';
    const METHOD_CASH = 'cash';
    const METHOD_CHECK = 'check';
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
    
    /**
     * Relasi ke Proposal
     */
    public function proposal()
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }
    
    /**
     * Relasi ke User (Bendahara yang proses)
     */
    public function processedByUser()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
    
    /**
     * Check if payment can be processed
     */
    public function canBeProcessed()
    {
        return $this->status === self::STATUS_PENDING;
    }
    
    /**
     * Check if payment can be completed
     */
    public function canBeCompleted()
    {
        return $this->status === self::STATUS_PROCESSING;
    }
    
    /**
     * Get status badge color
     */
    public function getStatusBadgeAttribute()
    {
        return [
            'pending' => 'bg-yellow-100 text-yellow-800',
            'processing' => 'bg-blue-100 text-blue-800',
            'completed' => 'bg-green-100 text-green-800',
            'failed' => 'bg-red-100 text-red-800',
        ][$this->status] ?? 'bg-gray-100 text-gray-800';
    }
    
    /**
     * Get status label
     */
    public function getStatusLabelAttribute()
    {
        return [
            'pending' => 'Menunggu',
            'processing' => 'Diproses',
            'completed' => 'Selesai',
            'failed' => 'Gagal',
        ][$this->status] ?? $this->status;
    }
}
```

---

### ✅ Step 3: Update Proposal Model

**File**: `app/Models/Proposal.php`

Tambahkan relasi ke Payment:

```php
/**
 * Relasi ke Payment
 */
public function payment()
{
    return $this->hasOne(Payment::class, 'proposal_id');
}

/**
 * Check if proposal needs payment
 */
public function needsPayment()
{
    return $this->status === self::STATUS_FINAL_APPROVED;
}

/**
 * Check if proposal is being paid
 */
public function isBeingPaid()
{
    return $this->status === self::STATUS_PAYMENT_PROCESSING;
}
```

---

### ✅ Step 4: PaymentController

**File**: `app/Http/Controllers/Api/PaymentController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Proposal;
use App\Models\Rkam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * GET /api/payments
     * List all payments
     */
    public function index(Request $request)
    {
        $query = Payment::with([
            'proposal.user:id,name,full_name,email',
            'proposal.rkam:id,kategori,item_name',
            'processedByUser:id,full_name'
        ]);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by payment method
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        
        // Order by created_at desc
        $payments = $query->latest()->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Payments retrieved successfully',
            'data' => $payments
        ]);
    }
    
    /**
     * GET /api/payments/pending
     * Get proposals yang perlu dibayar (status = final_approved)
     */
    public function getPendingPayments()
    {
        $proposals = Proposal::with([
            'user:id,name,full_name,email',
            'rkam:id,kategori,item_name,pagu,terpakai,sisa'
        ])
        ->where('status', Proposal::STATUS_FINAL_APPROVED)
        ->latest('final_approved_at')
        ->get();
        
        return response()->json([
            'success' => true,
            'message' => 'Pending payments retrieved successfully',
            'data' => $proposals
        ]);
    }
    
    /**
     * GET /api/payments/{id}
     * Get payment detail
     */
    public function show($id)
    {
        $payment = Payment::with([
            'proposal.user',
            'proposal.rkam',
            'processedByUser'
        ])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'message' => 'Payment retrieved successfully',
            'data' => $payment
        ]);
    }
    
    /**
     * POST /api/payments/{proposalId}/process
     * Mulai proses pembayaran (final_approved → payment_processing)
     */
    public function processPayment(Request $request, $proposalId)
    {
        // Authorization: Hanya Bendahara
        if (!auth()->user()->hasRole('bendahara')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Bendahara can process payments.'
            ], 403);
        }
        
        $proposal = Proposal::findOrFail($proposalId);
        
        // Validasi status
        if ($proposal->status !== Proposal::STATUS_FINAL_APPROVED) {
            return response()->json([
                'success' => false,
                'message' => 'Proposal not in final_approved status'
            ], 400);
        }
        
        // Validasi input
        $validator = Validator::make($request->all(), [
            'recipient_name' => 'required|string|max:255',
            'recipient_account' => 'required|string|max:100',
            'bank_name' => 'nullable|string|max:100',
            'payment_method' => 'required|in:transfer,cash,check',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            // Create payment record
            $payment = Payment::create([
                'proposal_id' => $proposal->id,
                'amount' => $proposal->jumlah_pengajuan,
                'recipient_name' => $request->recipient_name,
                'recipient_account' => $request->recipient_account,
                'bank_name' => $request->bank_name,
                'payment_method' => $request->payment_method,
                'payment_reference' => $request->payment_reference,
                'notes' => $request->notes,
                'status' => Payment::STATUS_PROCESSING,
                'processed_at' => now(),
                'processed_by' => auth()->id()
            ]);
            
            // Update proposal status
            $proposal->update([
                'status' => Proposal::STATUS_PAYMENT_PROCESSING
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment processing started successfully',
                'data' => [
                    'payment_id' => $payment->id,
                    'proposal_id' => $proposal->id,
                    'status' => $payment->status,
                    'amount' => $payment->amount,
                    'processed_at' => $payment->processed_at
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payment: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * POST /api/payments/{id}/complete
     * Selesaikan pembayaran (payment_processing → completed)
     */
    public function completePayment(Request $request, $id)
    {
        // Authorization: Hanya Bendahara
        if (!auth()->user()->hasRole('bendahara')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Bendahara can complete payments.'
            ], 403);
        }
        
        $payment = Payment::with('proposal.rkam')->findOrFail($id);
        
        // Validasi status
        if ($payment->status !== Payment::STATUS_PROCESSING) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not in processing status'
            ], 400);
        }
        
        // Validasi input
        $validator = Validator::make($request->all(), [
            'payment_proof_url' => 'nullable|string|max:500',
            'admin_notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            // Update payment status
            $payment->update([
                'status' => Payment::STATUS_COMPLETED,
                'payment_proof_url' => $request->payment_proof_url,
                'admin_notes' => $request->admin_notes,
                'completed_at' => now()
            ]);
            
            // Update proposal status
            $proposal = $payment->proposal;
            $proposal->update([
                'status' => Proposal::STATUS_COMPLETED,
                'completed_at' => now()
            ]);
            
            // Update RKAM terpakai & sisa
            $rkam = $proposal->rkam;
            $newTerpakai = (float)$rkam->terpakai + (float)$payment->amount;
            $newSisa = (float)$rkam->pagu - $newTerpakai;
            
            $rkam->update([
                'terpakai' => $newTerpakai,
                'sisa' => $newSisa
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment completed successfully. RKAM updated.',
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_status' => $payment->status,
                    'proposal_id' => $proposal->id,
                    'proposal_status' => $proposal->status,
                    'rkam_update' => [
                        'rkam_id' => $rkam->id,
                        'old_terpakai' => $rkam->terpakai - $payment->amount,
                        'new_terpakai' => $rkam->terpakai,
                        'new_sisa' => $rkam->sisa
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete payment: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * POST /api/payments/{id}/cancel
     * Batalkan pembayaran
     */
    public function cancelPayment(Request $request, $id)
    {
        // Authorization: Hanya Bendahara
        if (!auth()->user()->hasRole('bendahara')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Bendahara can cancel payments.'
            ], 403);
        }
        
        $payment = Payment::with('proposal')->findOrFail($id);
        
        // Validasi status
        if ($payment->status === Payment::STATUS_COMPLETED) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel completed payment'
            ], 400);
        }
        
        DB::beginTransaction();
        try {
            // Update payment status
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'admin_notes' => $request->reason ?? 'Payment cancelled'
            ]);
            
            // Kembalikan proposal ke final_approved
            $proposal = $payment->proposal;
            $proposal->update([
                'status' => Proposal::STATUS_FINAL_APPROVED
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment cancelled. Proposal returned to final_approved status.',
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_status' => $payment->status,
                    'proposal_id' => $proposal->id,
                    'proposal_status' => $proposal->status
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel payment: ' . $e->getMessage()
            ], 500);
        }
    }
}
```

---

### ✅ Step 5: API Routes

**File**: `routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    // Payment Management
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/pending', [PaymentController::class, 'getPendingPayments']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    
    // Payment Actions (Bendahara only)
    Route::post('/payments/{proposalId}/process', [PaymentController::class, 'processPayment']);
    Route::post('/payments/{id}/complete', [PaymentController::class, 'completePayment']);
    Route::post('/payments/{id}/cancel', [PaymentController::class, 'cancelPayment']);
});
```

---

## 🧪 Testing API

### **Test 1: Get Pending Payments (Proposals yang perlu dibayar)**

```bash
curl -X GET http://127.0.0.1:8000/api/payments/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending payments retrieved successfully",
  "data": [
    {
      "id": "9dc15c84-...",
      "title": "Proposal ABC",
      "jumlah_pengajuan": "30000000",
      "status": "final_approved",
      "final_approved_at": "2025-11-06 10:30:00",
      "user": {
        "id": "123",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "rkam": {
        "id": "456",
        "kategori": "Operasional",
        "item_name": "ATK Kantor"
      }
    }
  ]
}
```

### **Test 2: Process Payment**

```bash
curl -X POST http://127.0.0.1:8000/api/payments/9dc15c84-.../process \
  -H "Authorization: Bearer YOUR_BENDAHARA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "CV. Teknologi Maju",
    "recipient_account": "1234567890",
    "bank_name": "BCA",
    "payment_method": "transfer",
    "payment_reference": "TRF20251106001",
    "notes": "Pembayaran untuk pengadaan ATK"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment processing started successfully",
  "data": {
    "payment_id": "abc123-...",
    "proposal_id": "9dc15c84-...",
    "status": "processing",
    "amount": "30000000",
    "processed_at": "2025-11-06 14:00:00"
  }
}
```

### **Test 3: Complete Payment**

```bash
curl -X POST http://127.0.0.1:8000/api/payments/abc123-.../complete \
  -H "Authorization: Bearer YOUR_BENDAHARA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_proof_url": "https://example.com/bukti-transfer.pdf",
    "admin_notes": "Pembayaran selesai, dana sudah masuk rekening vendor"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully. RKAM updated.",
  "data": {
    "payment_id": "abc123-...",
    "payment_status": "completed",
    "proposal_id": "9dc15c84-...",
    "proposal_status": "completed",
    "rkam_update": {
      "rkam_id": "456",
      "old_terpakai": "5000000",
      "new_terpakai": "35000000",
      "new_sisa": "15000000"
    }
  }
}
```

---

## 📋 Implementation Checklist

### Database
- [ ] Create migration `2025_11_06_create_payments_table.php`
- [ ] Run migration: `php artisan migrate`
- [ ] Verify table exists: `SHOW TABLES LIKE 'payments';`

### Models
- [ ] Create `app/Models/Payment.php` with relationships
- [ ] Update `app/Models/Proposal.php` - add `payment()` relationship
- [ ] Add constants: STATUS_*, METHOD_*
- [ ] Add helper methods: `canBeProcessed()`, `canBeCompleted()`

### Controller
- [ ] Create `app/Http/Controllers/Api/PaymentController.php`
- [ ] Implement `index()` - list all payments
- [ ] Implement `getPendingPayments()` - proposals yang perlu dibayar
- [ ] Implement `show($id)` - payment detail
- [ ] Implement `processPayment($proposalId)` - mulai proses
- [ ] Implement `completePayment($id)` - selesaikan + update RKAM
- [ ] Implement `cancelPayment($id)` - batalkan pembayaran

### Routes
- [ ] Add routes di `routes/api.php`
- [ ] Test dengan Postman/curl

### Authorization
- [ ] Verify role `bendahara` exists di database
- [ ] Test authorization: only Bendahara can access
- [ ] Test dengan user non-Bendahara (should get 403)

### Testing
- [ ] Test `GET /api/payments/pending` - lihat proposals final_approved
- [ ] Test `POST /api/payments/{id}/process` - mulai proses
- [ ] Test `POST /api/payments/{id}/complete` - selesaikan
- [ ] Verify RKAM.terpakai bertambah
- [ ] Verify RKAM.sisa berkurang
- [ ] Verify proposal status jadi 'completed'

---

## 🎯 Summary

**Setelah implementasi backend ini:**

1. ✅ Bendahara buka `/api/payments/pending` → Muncul proposals dengan status `final_approved`
2. ✅ Bendahara proses payment → Status proposal jadi `payment_processing`
3. ✅ Bendahara selesaikan payment → Status proposal jadi `completed` + RKAM terupdate

**Frontend PaymentManagement.tsx akan fetch dari:**
- `GET /api/payments/pending` - Proposals yang perlu dibayar
- `GET /api/payments` - History semua payments
- `POST /api/payments/{proposalId}/process` - Proses pembayaran
- `POST /api/payments/{id}/complete` - Selesaikan pembayaran

---

**Silakan implementasi di backend dan test! 🚀**
