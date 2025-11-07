# 🔧 BACKEND FIX: Authorization Error - Verifikator Role

> **Issue**: "Unauthorized: Only Verifikator can verify proposals" meskipun sudah login sebagai verifikator  
> **Root Cause**: Role checking tidak match atau method `hasRole()` tidak berfungsi  
> **Tanggal**: 6 November 2025

---

## 🎯 Problem

User sudah login sebagai verifikator tapi saat mencoba verify proposal, dapat error:
```json
{
  "success": false,
  "message": "Unauthorized: Only Verifikator can verify proposals"
}
```

**Possible Causes:**
1. Role name di database tidak match dengan yang dicek (`verifikator` vs `Verifikator` vs `admin`)
2. Method `hasRole()` belum ada atau tidak berfungsi
3. Kolom `role` di tabel users tidak sesuai format
4. Token user tidak memiliki role information

---

## ✅ Solution

### **Step 1: Cek Role User yang Login**

**File**: `app/Http/Controllers/Api/ProposalController.php`

Tambahkan debug log di method `verify()`:

```php
public function verify(Request $request, $id)
{
    // DEBUG: Log user info
    \Log::info('Verify attempt', [
        'user_id' => auth()->id(),
        'user_role' => auth()->user()->role,
        'user_data' => auth()->user()->toArray()
    ]);
    
    // Authorization check
    if (!auth()->user()->hasRole('verifikator')) {
        \Log::error('Authorization failed', [
            'expected_role' => 'verifikator',
            'actual_role' => auth()->user()->role
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Only Verifikator can verify proposals.'
        ], 403);
    }
    
    // ... rest of code
}
```

**Jalankan request lagi dan cek log:**
```bash
tail -f storage/logs/laravel.log
```

---

### **Step 2: Fix hasRole() Method**

**File**: `app/Models/User.php`

**Pastikan method `hasRole()` ada dan benar:**

```php
class User extends Authenticatable
{
    // ... existing code ...
    
    /**
     * Check if user has specific role
     */
    public function hasRole($role)
    {
        // Case-insensitive comparison
        return strtolower($this->role) === strtolower($role);
    }
    
    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole($roles)
    {
        $roles = is_array($roles) ? $roles : func_get_args();
        
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }
        
        return false;
    }
}
```

---

### **Step 3: Cek Data Role di Database**

Jalankan query di database:

```sql
-- Cek role user yang login
SELECT id, name, email, role FROM users WHERE email = 'your_verifikator_email@example.com';

-- Cek semua role yang ada
SELECT DISTINCT role FROM users;
```

**Expected Output:**
```
┌──────┬────────────┬───────────────────────┬─────────────┐
│ id   │ name       │ email                 │ role        │
├──────┼────────────┼───────────────────────┼─────────────┤
│ 123  │ John Doe   │ verif@example.com     │ verifikator │
└──────┴────────────┴───────────────────────┴─────────────┘
```

**Possible Issues:**
- ❌ Role adalah `Verifikator` (capital V) → Backend cek `verifikator` (lowercase)
- ❌ Role adalah `admin` → User bukan verifikator
- ❌ Role adalah `verifikator ` (dengan spasi) → Trim issue

---

### **Step 4: Fix Role Comparison**

**Option A: Case-Insensitive (Recommended)**

Update semua role checks jadi case-insensitive:

```php
// app/Http/Controllers/Api/ProposalController.php

public function verify(Request $request, $id)
{
    // Case-insensitive role check
    $userRole = strtolower(auth()->user()->role);
    
    if ($userRole !== 'verifikator') {
        return response()->json([
            'success' => false,
            'message' => "Unauthorized. Only Verifikator can verify proposals. Your role: {$userRole}"
        ], 403);
    }
    
    // ... rest of code
}
```

**Option B: Standardize Database**

Update semua role di database jadi lowercase:

```sql
UPDATE users SET role = LOWER(TRIM(role));
```

---

### **Step 5: Alternative - Role Constants**

**File**: `app/Models/User.php`

Buat constants untuk role:

```php
class User extends Authenticatable
{
    // Role constants
    const ROLE_PENGUSUL = 'pengusul';
    const ROLE_VERIFIKATOR = 'verifikator';
    const ROLE_KEPALA_MADRASAH = 'kepala_madrasah';
    const ROLE_KOMITE = 'komite';
    const ROLE_BENDAHARA = 'bendahara';
    const ROLE_ADMIN = 'admin';
    
    /**
     * Check if user has specific role
     */
    public function hasRole($role)
    {
        return strtolower(trim($this->role)) === strtolower(trim($role));
    }
    
    /**
     * Check if user is verifikator
     */
    public function isVerifikator()
    {
        return $this->hasRole(self::ROLE_VERIFIKATOR);
    }
    
    /**
     * Check if user is kepala madrasah
     */
    public function isKepalaMadrasah()
    {
        return $this->hasRole(self::ROLE_KEPALA_MADRASAH);
    }
    
    /**
     * Check if user is komite
     */
    public function isKomite()
    {
        return $this->hasRole(self::ROLE_KOMITE);
    }
}
```

**Update ProposalController:**

```php
public function verify(Request $request, $id)
{
    if (!auth()->user()->isVerifikator()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Only Verifikator can verify proposals.'
        ], 403);
    }
    
    // ... rest of code
}

public function approve(Request $request, $id)
{
    if (!auth()->user()->isKepalaMadrasah()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Only Kepala Madrasah can approve proposals.'
        ], 403);
    }
    
    // ... rest of code
}

public function finalApprove(Request $request, $id)
{
    if (!auth()->user()->isKomite()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Only Komite can final approve proposals.'
        ], 403);
    }
    
    // ... rest of code
}
```

---

## 🧪 Testing

### **Test 1: Check Current User Role**

Tambahkan endpoint test di backend:

```php
// routes/api.php
Route::middleware('auth:sanctum')->get('/debug/me', function () {
    return response()->json([
        'user' => auth()->user(),
        'role' => auth()->user()->role,
        'role_lowercase' => strtolower(auth()->user()->role),
        'is_verifikator' => auth()->user()->hasRole('verifikator'),
        'token_valid' => true
    ]);
});
```

**Test di browser console:**

```javascript
fetch('http://127.0.0.1:8000/api/debug/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sirangkul_token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('🔐 Current User:', data);
  console.log('📋 Role:', data.role);
  console.log('✅ Is Verifikator?', data.is_verifikator);
});
```

**Expected Output:**
```javascript
{
  user: { id: "123", name: "John Doe", email: "verif@example.com", role: "verifikator" },
  role: "verifikator",
  role_lowercase: "verifikator",
  is_verifikator: true,
  token_valid: true
}
```

### **Test 2: Try Verify with Debug**

Di ProposalApproval.tsx, update handleVerify untuk log error detail:

```typescript
const handleVerify = async (action: 'approve' | 'reject') => {
  try {
    console.log('🔄 Verifying proposal:', proposalId, 'Action:', action);
    
    if (action === 'approve') {
      const result = await apiService.verifyProposal(proposalId);
      console.log('✅ Verify success:', result);
    } else {
      // reject logic
    }
  } catch (err) {
    console.error('❌ Verify failed:', err);
    console.error('Error details:', {
      message: err.message,
      response: err.response,
    });
    setError(err instanceof Error ? err.message : 'Gagal memverifikasi proposal');
  }
};
```

---

## 📋 Quick Fix Checklist

- [ ] **Step 1**: Tambah debug log di `verify()` method
- [ ] **Step 2**: Cek `storage/logs/laravel.log` untuk lihat role user
- [ ] **Step 3**: Query database untuk cek role format
- [ ] **Step 4**: Fix `hasRole()` method jadi case-insensitive
- [ ] **Step 5**: Update semua authorization checks di controller
- [ ] **Step 6**: Test dengan endpoint `/api/debug/me`
- [ ] **Step 7**: Test verify proposal lagi
- [ ] **Step 8**: Hapus debug log setelah fix

---

## 🎯 Common Role Issues & Solutions

### **Issue 1: Role dengan Spasi**
```sql
-- Fix: Trim spaces
UPDATE users SET role = TRIM(role);
```

### **Issue 2: Role dengan Capital Letter**
```sql
-- Fix: Lowercase semua
UPDATE users SET role = LOWER(role);
```

### **Issue 3: Role Name Berbeda**
```sql
-- Cek role yang ada
SELECT DISTINCT role FROM users;

-- Expected: verifikator, kepala_madrasah, komite, bendahara, pengusul
-- Jika berbeda, update:
UPDATE users SET role = 'verifikator' WHERE role = 'Verifikator';
UPDATE users SET role = 'kepala_madrasah' WHERE role IN ('Kepala Madrasah', 'kepala madrasah', 'KepMad', 'kepala');
UPDATE users SET role = 'komite' WHERE role IN ('Komite', 'Komite Madrasah', 'komite madrasah');
UPDATE users SET role = 'bendahara' WHERE role IN ('Bendahara', 'BENDAHARA');
UPDATE users SET role = 'pengusul' WHERE role IN ('Pengusul', 'Guru', 'guru');
```

### **⚠️ IMPORTANT: Role untuk Kepala Madrasah**

Backend menggunakan: **`kepala_madrasah`** (dengan underscore, lowercase)

**Possible wrong values:**
- ❌ `Kepala Madrasah` (dengan spasi, capital)
- ❌ `kepala madrasah` (dengan spasi, lowercase)
- ❌ `KepMad` (singkatan)
- ❌ `kepala` (tidak lengkap)

**Fix:**
```sql
-- Cek dulu role Anda
SELECT id, name, email, role FROM users WHERE email = 'your_email@example.com';

-- Update ke format yang benar
UPDATE users 
SET role = 'kepala_madrasah' 
WHERE role IN ('Kepala Madrasah', 'kepala madrasah', 'KepMad', 'kepala');
```

### **Issue 4: Token Tidak Memiliki Role Info**

Cek response dari `/api/auth/login`:

```json
{
  "token": "...",
  "user": {
    "id": "123",
    "full_name": "John Doe",
    "role": "verifikator"  // ✅ Pastikan ada ini
  }
}
```

Jika role tidak ada, update LoginController:

```php
return response()->json([
    'token' => $token,
    'user' => [
        'id' => $user->id,
        'full_name' => $user->full_name,
        'role' => $user->role,  // ✅ Pastikan kirim role
    ]
]);
```

---

## 🚀 Recommended Solution (Complete)

**1. Update User Model:**

```php
// app/Models/User.php
class User extends Authenticatable
{
    const ROLE_VERIFIKATOR = 'verifikator';
    const ROLE_KEPALA_MADRASAH = 'kepala_madrasah';
    const ROLE_KOMITE = 'komite';
    const ROLE_BENDAHARA = 'bendahara';
    
    public function hasRole($role)
    {
        return strtolower(trim($this->role)) === strtolower(trim($role));
    }
    
    public function isVerifikator()
    {
        return $this->hasRole(self::ROLE_VERIFIKATOR);
    }
}
```

**2. Standardize Database:**

```sql
UPDATE users SET role = LOWER(TRIM(role));
```

**3. Update Controller:**

```php
// app/Http/Controllers/Api/ProposalController.php
public function verify(Request $request, $id)
{
    if (!auth()->user()->isVerifikator()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. Only Verifikator can verify proposals.',
            'debug' => [
                'your_role' => auth()->user()->role,
                'required_role' => User::ROLE_VERIFIKATOR
            ]
        ], 403);
    }
    
    // ... rest of code
}
```

**4. Test:**

```bash
# Login as verifikator
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verif@example.com","password":"password"}'

# Save token and test verify
curl -X POST http://127.0.0.1:8000/api/proposals/123/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
```

---

## 🚨 QUICK FIX: Kepala Madrasah 403 Error

**Problem**: "Unauthorized: Only Kepala Madrasah can approve proposals"

**Debug Steps:**

### **1. Cek Role di Console Browser**

Copy paste ke browser console:

```javascript
// Quick check
const user = JSON.parse(localStorage.getItem('sirangkul_user') || '{}');
console.log('Your Role:', user.role);
console.log('Expected:', 'kepala_madrasah');
console.log('Match?', user.role === 'kepala_madrasah');
```

### **2. Jika Role Tidak Match**

**Kemungkinan role Anda:**
- `Kepala Madrasah` (dengan spasi dan capital) ❌
- `kepala madrasah` (dengan spasi) ❌
- `KepMad` (singkatan) ❌

**Fix di Database:**

```sql
-- Cek role saat ini
SELECT id, name, email, role 
FROM users 
WHERE email = 'your_email@example.com';

-- Update ke format benar
UPDATE users 
SET role = 'kepala_madrasah' 
WHERE email = 'your_email@example.com';

-- Atau update semua Kepala Madrasah
UPDATE users 
SET role = 'kepala_madrasah' 
WHERE role IN ('Kepala Madrasah', 'kepala madrasah', 'KepMad', 'kepala');
```

### **3. Logout & Login Ulang**

Setelah update database:

1. Logout dari aplikasi
2. Login kembali dengan akun Kepala Madrasah
3. Token baru akan memiliki role yang sudah diupdate
4. Test approve proposal lagi

### **4. Verify Fix**

Di browser console:

```javascript
fetch('http://127.0.0.1:8000/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sirangkul_token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Role:', data.role);
  console.log('✅ Should be:', 'kepala_madrasah');
  console.log('✅ Match?', data.role === 'kepala_madrasah');
});
```

---

## 📋 Complete Role Mapping

| UI Display          | Database Value    | Backend Check      |
|---------------------|-------------------|--------------------|
| Pengusul            | `pengusul`        | `pengusul`         |
| Verifikator         | `verifikator`     | `verifikator`      |
| Kepala Madrasah     | `kepala_madrasah` | `kepala_madrasah`  |
| Komite Madrasah     | `komite`          | `komite`           |
| Bendahara           | `bendahara`       | `bendahara`        |

**Rules:**
- ✅ Lowercase semua
- ✅ Underscore (_) bukan spasi
- ✅ Tidak boleh singkatan
- ✅ Trim leading/trailing spaces

---

**Silakan coba fix di backend dan test lagi! 🎉**
