# 🔧 BACKEND FIX: Proposal User Relation

> **Issue**: Data pengusul (user) tidak muncul di frontend ProposalTracking  
> **Root Cause**: Backend tidak melakukan eager loading relasi `user` saat fetch proposals  
> **Tanggal**: 6 November 2025

---

## 🎯 Problem

Saat frontend memanggil `GET /api/proposals`, response tidak menyertakan data relasi `user` (pengusul), sehingga field seperti `proposal.user.name` atau `proposal.user.full_name` bernilai `undefined`.

**Frontend Expected:**
```json
{
  "id": "123",
  "title": "Proposal ABC",
  "user": {
    "id": "456",
    "name": "John Doe",
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Backend Currently Returns:**
```json
{
  "id": "123",
  "title": "Proposal ABC",
  "user_id": "456"
  // ❌ relasi user tidak di-load
}
```

---

## ✅ Solution: Add Eager Loading

### **File**: `app/Http/Controllers/Api/ProposalController.php`

Perlu update method `index()` dan `show()` untuk eager load semua relasi yang dibutuhkan frontend.

---

## 📝 TODO List

### [ ] 1. Update Method `index()` - List All Proposals

**Location**: `app/Http/Controllers/Api/ProposalController.php`

**Find:**
```php
public function index()
{
    $proposals = Proposal::latest()->get();
    
    return response()->json([
        'success' => true,
        'message' => 'Proposals retrieved successfully',
        'data' => $proposals
    ]);
}
```

**Replace with:**
```php
public function index()
{
    $proposals = Proposal::with([
        'user:id,name,full_name,email,role',  // ✅ Pengusul
        'rkam:id,kategori,item_name,pagu,terpakai,sisa',  // ✅ RKAM info
        'verifier:id,full_name,role',  // ✅ Verifikator
        'approver:id,full_name,role',  // ✅ Kepala Madrasah
        'rejector:id,full_name,role',  // ✅ Rejector (jika ditolak)
        'final_approver:id,full_name,role'  // ✅ Komite Madrasah
    ])
    ->latest()
    ->get();
    
    return response()->json([
        'success' => true,
        'message' => 'Proposals retrieved successfully',
        'data' => $proposals
    ]);
}
```

**Why**: Frontend membutuhkan data pengusul (user.name/full_name) untuk ditampilkan di tabel tracking.

---

### [ ] 2. Update Method `show()` - Get Single Proposal

**Location**: `app/Http/Controllers/Api/ProposalController.php`

**Find:**
```php
public function show($id)
{
    $proposal = Proposal::findOrFail($id);
    
    return response()->json([
        'success' => true,
        'message' => 'Proposal retrieved successfully',
        'data' => $proposal
    ]);
}
```

**Replace with:**
```php
public function show($id)
{
    $proposal = Proposal::with([
        'user:id,name,full_name,email,role',
        'rkam:id,kategori,item_name,pagu,terpakai,sisa,deskripsi',
        'verifier:id,full_name,role',
        'approver:id,full_name,role',
        'rejector:id,full_name,role',
        'final_approver:id,full_name,role'
    ])
    ->findOrFail($id);
    
    return response()->json([
        'success' => true,
        'message' => 'Proposal retrieved successfully',
        'data' => $proposal
    ]);
}
```

---

### [ ] 3. Verify Proposal Model Has Relationships Defined

**Location**: `app/Models/Proposal.php`

**Pastikan ada method-method ini:**

```php
class Proposal extends Model
{
    // ... existing code ...
    
    /**
     * Relasi ke User (pengusul)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    /**
     * Relasi ke RKAM
     */
    public function rkam()
    {
        return $this->belongsTo(Rkam::class, 'rkam_id');
    }
    
    /**
     * Relasi ke Verifikator
     */
    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
    
    /**
     * Relasi ke Approver (Kepala Madrasah)
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    
    /**
     * Relasi ke Rejector
     */
    public function rejector()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
    
    /**
     * Relasi ke Final Approver (Komite)
     */
    public function final_approver()
    {
        return $this->belongsTo(User::class, 'final_approved_by');
    }
}
```

**Action**: Jika belum ada, tambahkan method-method ini.

---

### [ ] 4. Verify User Model Has `full_name` Field

**Location**: `app/Models/User.php`

**Pastikan tabel users punya kolom `full_name`:**

```php
class User extends Model
{
    protected $fillable = [
        'name',
        'full_name',  // ✅ Pastikan ada ini
        'email',
        'password',
        'role',
    ];
}
```

**Jika tabel users TIDAK punya kolom `full_name`:**

**Option A**: Gunakan kolom `name` saja di eager loading
```php
'user:id,name,email,role',  // Tanpa full_name
```

**Option B**: Buat migration untuk add column `full_name`
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('full_name')->nullable()->after('name');
});
```

---

## 🧪 Testing

### **Test 1: Check API Response**

```bash
# Login dulu untuk dapat token
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Save token ke variable
$TOKEN = "your_token_here"

# Test GET proposals
curl -X GET http://127.0.0.1:8000/api/proposals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposals retrieved successfully",
  "data": [
    {
      "id": "123",
      "title": "Proposal ABC",
      "user_id": "456",
      "status": "submitted",
      "user": {  // ✅ Harus ada ini
        "id": "456",
        "name": "John Doe",
        "full_name": "John Doe",
        "email": "john@example.com",
        "role": "guru"
      },
      "rkam": {  // ✅ Harus ada ini
        "id": "789",
        "kategori": "Operasional",
        "item_name": "ATK Kantor",
        "pagu": "10000000",
        "terpakai": "2000000",
        "sisa": "8000000"
      },
      "verifier": null,  // Belum diverifikasi
      "approver": null,
      "rejector": null,
      "final_approver": null
    }
  ]
}
```

### **Test 2: Check in Browser Console**

Setelah backend diupdate, buka frontend:

1. Login ke aplikasi
2. Buka menu "Proposal" → "Lacak Proposal"
3. Buka Developer Tools (F12) → Tab Console
4. Lihat log:
   ```
   📊 Proposals data from API: Array(5) [...]
   👤 First proposal user data: { id: "456", name: "John Doe", full_name: "John Doe", email: "john@example.com" }
   ```

✅ **Jika `user data` ada**, berarti fix berhasil!  
❌ **Jika `user data` masih undefined**, cek lagi eager loading di backend.

---

## 📊 Impact Analysis

### **Frontend Files Affected:**
- ✅ `src/pages/ProposalTracking.tsx` - Sudah ada fallback `user?.name || user?.full_name`
- ✅ `src/pages/ProposalList.tsx` - Akan otomatis berfungsi
- ✅ `src/pages/ProposalDetail.tsx` - Akan otomatis berfungsi
- ✅ `src/pages/ProposalApproval.tsx` - Akan otomatis berfungsi

### **Backend Files to Update:**
- 🔧 `app/Http/Controllers/Api/ProposalController.php` - Method `index()` dan `show()`
- ✅ `app/Models/Proposal.php` - Verify relationships exist
- ✅ `app/Models/User.php` - Verify full_name field

---

## ⚠️ Important Notes

### **Performance Consideration**

Eager loading dengan `with()` lebih efisien daripada lazy loading (N+1 query problem).

**Before (Lazy Loading - BAD):**
```sql
-- 1 query untuk proposals
SELECT * FROM proposals;

-- N queries untuk setiap proposal (N+1 problem!)
SELECT * FROM users WHERE id = '123';
SELECT * FROM users WHERE id = '124';
SELECT * FROM users WHERE id = '125';
-- ... dst untuk setiap proposal
```

**After (Eager Loading - GOOD):**
```sql
-- 1 query untuk proposals
SELECT * FROM proposals;

-- 1 query untuk semua users (efficient!)
SELECT * FROM users WHERE id IN ('123', '124', '125', ...);
```

### **Column Selection**

Saat eager load, gunakan column selection (`:id,name,email`) untuk mengurangi data transfer:

```php
// ❌ BAD: Load semua kolom (termasuk password hash, remember_token, dll)
'user'

// ✅ GOOD: Load only needed columns
'user:id,name,full_name,email,role'
```

---

## 🎯 Summary Checklist

- [ ] Update `ProposalController::index()` dengan eager loading
- [ ] Update `ProposalController::show()` dengan eager loading
- [ ] Verify Proposal model punya semua relationship methods
- [ ] Verify User model punya field `full_name` (atau gunakan `name` saja)
- [ ] Test API response dengan curl/Postman
- [ ] Test di frontend browser console
- [ ] Verify data pengusul muncul di tabel tracking

---

## 🚀 After Fix

Setelah backend diupdate, frontend akan otomatis menampilkan:

1. ✅ Nama pengusul di kolom "Pengusul" (ProposalTracking)
2. ✅ Email pengusul di detail modal
3. ✅ Nama verifikator di timeline
4. ✅ Nama approver di timeline
5. ✅ Nama komite di timeline
6. ✅ Info RKAM lengkap di modal
7. ✅ Search by nama pengusul akan berfungsi

---

**File ini bisa dihapus setelah backend fix selesai! 🎉**
