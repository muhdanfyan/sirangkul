# 🔧 Backend Payment Pending Endpoint Fix

## ❌ Masalah Saat Ini

**Frontend tidak menampilkan proposal yang sudah disetujui Kepala Madrasah** di halaman Payment Management.

### Gejala:
- Frontend memanggil `GET /api/payments/pending` 
- Response: data seeder/dummy, bukan data real dari database
- Proposal dengan status `final_approved` tidak muncul di tabel "Proposal Perlu Dibayar"

---

## ✅ TODO Backend - Payment Pending Endpoint

### 📍 **File: `app/Http/Controllers/PaymentController.php`**

#### **Method: `getPendingPayments()`**

**CURRENT (Seeder/Dummy):**
```php
public function getPendingPayments()
{
    // ❌ Ini return data dummy/seeder
    $proposals = Proposal::where('status', 'final_approved')
        ->with(['user', 'rkam'])
        ->get();
    
    return response()->json([
        'success' => true,
        'message' => 'Pending payments retrieved',
        'data' => $proposals
    ]);
}
```

**HARUS DIUBAH JADI:**
```php
public function getPendingPayments()
{
    try {
        // ✅ Query proposal dengan status final_approved
        // ✅ Yang BELUM punya payment record
        $proposals = Proposal::where('status', 'final_approved')
            ->whereDoesntHave('payment') // Proposal yang belum punya payment
            ->with([
                'user:id,name,full_name,email',
                'rkam:id,kategori,item_name,pagu,terpakai,sisa',
                'final_approver:id,full_name'
            ])
            ->orderBy('final_approved_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Pending payments retrieved successfully',
            'data' => $proposals
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error fetching pending payments: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch pending payments: ' . $e->getMessage(),
            'data' => []
        ], 500);
    }
}
```

---

### 📍 **File: `app/Models/Proposal.php`**

#### **Tambah Relationship ke Payment**

**CEK apakah sudah ada:**
```php
public function payment()
{
    return $this->hasOne(Payment::class, 'proposal_id', 'id');
}
```

**Jika BELUM ada, tambahkan:**
```php
/**
 * Get the payment record for this proposal
 */
public function payment()
{
    return $this->hasOne(Payment::class, 'proposal_id', 'id');
}
```

---

## 🧪 Testing Backend

### **1. Cek Data di Database**

**Query manual untuk cek proposal final_approved:**
```sql
SELECT 
    id, 
    title, 
    user_id, 
    rkam_id,
    jumlah_pengajuan,
    status, 
    final_approved_at,
    final_approved_by
FROM proposals 
WHERE status = 'final_approved'
ORDER BY final_approved_at DESC;
```

**Expected Result:**
- Harus ada minimal 1 proposal dengan `status = 'final_approved'`
- `final_approved_at` tidak null
- `final_approved_by` tidak null

---

### **2. Cek Payment Record**

**Query untuk cek payment yang sudah ada:**
```sql
SELECT 
    p.id as payment_id,
    p.proposal_id,
    pr.title as proposal_title,
    p.status as payment_status,
    pr.status as proposal_status
FROM payments p
LEFT JOIN proposals pr ON p.proposal_id = pr.id
ORDER BY p.created_at DESC;
```

**Expected:**
- Proposal yang sudah punya payment TIDAK boleh muncul di pending list
- Proposal dengan `final_approved` tapi BELUM punya payment HARUS muncul

---

### **3. Test API Endpoint**

**Menggunakan Postman/Thunder Client:**

```http
GET http://127.0.0.1:8000/api/payments/pending
Authorization: Bearer {your_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Pending payments retrieved successfully",
  "data": [
    {
      "id": "uuid-proposal-1",
      "title": "Proposal Renovasi Ruang Kelas",
      "rkam_id": "uuid-rkam-1",
      "user_id": "uuid-user-1",
      "jumlah_pengajuan": "5000000",
      "status": "final_approved",
      "final_approved_at": "2025-01-15T10:30:00.000000Z",
      "final_approved_by": "uuid-kepala-madrasah",
      "user": {
        "id": "uuid-user-1",
        "name": "Ahmad Fauzi",
        "full_name": "Ahmad Fauzi, S.Pd",
        "email": "ahmad@example.com"
      },
      "rkam": {
        "id": "uuid-rkam-1",
        "kategori": "Renovasi",
        "item_name": "Renovasi Ruang Kelas",
        "pagu": "50000000",
        "terpakai": "20000000",
        "sisa": "30000000"
      },
      "final_approver": {
        "id": "uuid-kepala-madrasah",
        "full_name": "Dr. H. Abdullah, M.Pd"
      }
    }
  ]
}
```

---

### **4. Test dengan Curl**

```bash
curl -X GET "http://127.0.0.1:8000/api/payments/pending" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## 🔍 Debugging Checklist

### ✅ **Jika Endpoint Return Empty Array `[]`:**

1. **Cek Database:**
   ```sql
   SELECT COUNT(*) FROM proposals WHERE status = 'final_approved';
   ```
   - Jika 0 → Tidak ada data, perlu approve proposal dulu
   - Jika > 0 → Lanjut cek step 2

2. **Cek Relationship:**
   ```sql
   SELECT 
       pr.id,
       pr.title,
       pr.status,
       p.id as payment_id
   FROM proposals pr
   LEFT JOIN payments p ON pr.id = p.proposal_id
   WHERE pr.status = 'final_approved';
   ```
   - Jika semua proposal sudah punya `payment_id` → Berarti sudah diproses semua
   - Jika ada yang `payment_id = NULL` → Harusnya muncul di pending list

3. **Cek Laravel Log:**
   ```bash
   tail -f storage/logs/laravel.log
   ```
   - Lihat apakah ada error saat query

4. **Test Query Manual di Tinker:**
   ```bash
   php artisan tinker
   ```
   ```php
   $proposals = \App\Models\Proposal::where('status', 'final_approved')
       ->whereDoesntHave('payment')
       ->with(['user', 'rkam'])
       ->get();
   
   dump($proposals->count());
   dump($proposals->pluck('title', 'id'));
   ```

---

### ✅ **Jika Endpoint Return 401/403:**

**Cek Middleware Authorization di `routes/api.php`:**
```php
// ❌ SALAH - Jika cuma bisa Kepala Sekolah
Route::get('/payments/pending', [PaymentController::class, 'getPendingPayments'])
    ->middleware(['auth:sanctum', 'role:Kepala Sekolah']);

// ✅ BENAR - Harus role Bendahara
Route::get('/payments/pending', [PaymentController::class, 'getPendingPayments'])
    ->middleware(['auth:sanctum', 'role:Bendahara']);
```

---

### ✅ **Jika Endpoint Return 500 Error:**

**Tambahkan try-catch di Controller (sudah ada di code fix di atas)**

**Cek error di Laravel log:**
```bash
tail -n 50 storage/logs/laravel.log
```

**Common errors:**
- Missing relationship → Add `payment()` relationship di `Proposal.php`
- Missing column → Run migration
- Query error → Check table/column names

---

## 📋 Step-by-Step Implementation

### **Step 1: Update Proposal Model**
```bash
# Edit file
nano app/Models/Proposal.php

# Tambahkan relationship payment() jika belum ada
```

### **Step 2: Update PaymentController**
```bash
# Edit file
nano app/Http/Controllers/PaymentController.php

# Replace method getPendingPayments() dengan code fix di atas
```

### **Step 3: Clear Cache**
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### **Step 4: Test Endpoint**
```bash
# Restart server
php artisan serve

# Test dengan curl atau Postman
curl -X GET "http://127.0.0.1:8000/api/payments/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 5: Verify Frontend**
1. Buka browser → DevTools (F12) → Console tab
2. Refresh halaman Payment Management
3. Lihat log: `✅ Payment data loaded:`
4. Cek `pendingProposals` array harus berisi data

---

## 🎯 Expected Result

**Setelah fix:**
- ✅ Endpoint `/api/payments/pending` return proposal dengan status `final_approved`
- ✅ Hanya proposal yang BELUM punya payment record
- ✅ Frontend menampilkan proposal di tabel "Proposal Perlu Dibayar"
- ✅ Tombol "Proses Pembayaran" muncul
- ✅ Stats card "Menunggu Proses" menampilkan jumlah yang benar

**Console log di browser:**
```javascript
✅ Payment data loaded: {
  pendingProposals: [
    {
      id: "uuid-1",
      title: "Proposal Renovasi",
      status: "final_approved",
      jumlah_pengajuan: "5000000",
      user: { ... },
      rkam: { ... }
    }
  ],
  pendingCount: 1,
  payments: [...],
  paymentsCount: 0
}
```

---

## 📝 Notes

1. **Relationship is Key:** 
   - `whereDoesntHave('payment')` hanya bekerja jika relationship `payment()` sudah didefinisikan di `Proposal.php`

2. **Status Flow:**
   ```
   final_approved (no payment) → pending payment
   final_approved + payment created → payment_processing
   payment_processing + completed → completed
   ```

3. **Data Seeder:**
   - Jika masih pakai data seeder, pastikan seeder juga create proposal dengan status `final_approved`
   - Atau approve proposal manual via frontend/tinker

4. **Testing Order:**
   - Test backend endpoint dulu (Postman/curl)
   - Baru test frontend setelah backend confirmed working

---

## 🚀 Quick Test Commands

```bash
# 1. Cek proposal final_approved
php artisan tinker
>>> \App\Models\Proposal::where('status', 'final_approved')->count()

# 2. Test endpoint
curl -X GET "http://127.0.0.1:8000/api/payments/pending" \
  -H "Authorization: Bearer YOUR_TOKEN" | json_pp

# 3. Clear cache
php artisan optimize:clear

# 4. Restart server
php artisan serve --host=127.0.0.1 --port=8000
```

---

**Created:** 2025-11-07  
**For:** SIRANGKUL Payment Module  
**Priority:** 🔥 HIGH - Blocking payment workflow
