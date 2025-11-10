# Testing RKAM API Integration

## Prerequisites
- Backend Laravel sudah running di `http://127.0.0.1:8000`
- Database sudah di-migrate dan di-seed dengan RkamSeeder
- Sudah login dan punya token authentication

## Test Steps

### 1. Test GET /api/rkam (List All RKAM)

**Command:**
```bash
curl -X GET "http://127.0.0.1:8000/api/rkam" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "RKAM list retrieved successfully",
  "data": [
    {
      "id": "uuid-1",
      "kategori": "Renovasi",
      "item_name": "Renovasi Gedung Sekolah",
      "pagu": "50000000.00",
      "tahun_anggaran": 2025,
      "deskripsi": "Renovasi gedung utama termasuk atap dan lantai",
      "terpakai": "0.00",
      "sisa": "50000000.00",
      "persentase": 0,
      "status": "Normal",
      "created_at": "2025-11-05T10:00:00.000000Z",
      "updated_at": "2025-11-05T10:00:00.000000Z"
    }
  ]
}
```

---

### 2. Test POST /api/rkam (Create RKAM)

**Command:**
```bash
curl -X POST "http://127.0.0.1:8000/api/rkam" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "kategori": "Operasional",
    "item_name": "Operasional Bulanan",
    "pagu": 30000000,
    "tahun_anggaran": 2025,
    "deskripsi": "Biaya operasional rutin sekolah"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "RKAM created successfully",
  "data": {
    "id": "new-uuid",
    "kategori": "Operasional",
    "item_name": "Operasional Bulanan",
    "pagu": "30000000.00",
    "tahun_anggaran": 2025,
    "deskripsi": "Biaya operasional rutin sekolah",
    "terpakai": "0.00",
    "sisa": "30000000.00",
    "persentase": 0,
    "status": "Normal",
    "created_at": "2025-11-05T11:00:00.000000Z",
    "updated_at": "2025-11-05T11:00:00.000000Z"
  }
}
```

---

### 3. Test GET /api/rkam/{id} (Get RKAM Detail)

**Command:**
```bash
curl -X GET "http://127.0.0.1:8000/api/rkam/YOUR_RKAM_ID" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "RKAM retrieved successfully",
  "data": {
    "id": "uuid-1",
    "kategori": "Renovasi",
    "item_name": "Renovasi Gedung Sekolah",
    "pagu": "50000000.00",
    "tahun_anggaran": 2025,
    "deskripsi": "Renovasi gedung utama termasuk atap dan lantai",
    "terpakai": "0.00",
    "sisa": "50000000.00",
    "persentase": 0,
    "status": "Normal",
    "created_at": "2025-11-05T10:00:00.000000Z",
    "updated_at": "2025-11-05T10:00:00.000000Z",
    "proposals": []
  }
}
```

---

### 4. Test PUT /api/rkam/{id} (Update RKAM)

**Command:**
```bash
curl -X PUT "http://127.0.0.1:8000/api/rkam/YOUR_RKAM_ID" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "pagu": 55000000,
    "deskripsi": "Update budget untuk renovasi gedung"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "RKAM updated successfully",
  "data": {
    "id": "uuid-1",
    "kategori": "Renovasi",
    "item_name": "Renovasi Gedung Sekolah",
    "pagu": "55000000.00",
    "tahun_anggaran": 2025,
    "deskripsi": "Update budget untuk renovasi gedung",
    "terpakai": "0.00",
    "sisa": "55000000.00",
    "persentase": 0,
    "status": "Normal",
    "created_at": "2025-11-05T10:00:00.000000Z",
    "updated_at": "2025-11-05T11:30:00.000000Z"
  }
}
```

---

### 5. Test DELETE /api/rkam/{id} (Delete RKAM)

**Command:**
```bash
curl -X DELETE "http://127.0.0.1:8000/api/rkam/YOUR_RKAM_ID" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "RKAM deleted successfully"
}
```

**Expected Response (Error - has proposals):**
```json
{
  "success": false,
  "message": "Cannot delete RKAM. There are proposals linked to this RKAM."
}
```

---

### 6. Test Filter by Kategori

**Command:**
```bash
curl -X GET "http://127.0.0.1:8000/api/rkam?kategori=Renovasi" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 7. Test Search by Item Name

**Command:**
```bash
curl -X GET "http://127.0.0.1:8000/api/rkam?search=Gedung" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 8. Test Filter by Tahun Anggaran

**Command:**
```bash
curl -X GET "http://127.0.0.1:8000/api/rkam?tahun_anggaran=2025" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Integration Test

### Manual Test dalam Browser:

1. **Login** ke aplikasi (http://localhost:5173/login)
2. Navigate ke **RKAM Management** page
3. Cek apakah:
   - ✅ Data RKAM tampil dari backend (6 items dari seeder)
   - ✅ Summary cards menampilkan total yang benar
   - ✅ Search berfungsi (coba ketik "Gedung")
   - ✅ Filter kategori berfungsi (pilih "Renovasi")
   - ✅ Tombol "Tambah RKAM" membuka modal
   - ✅ Form create RKAM berfungsi (submit dan data muncul di tabel)
   - ✅ Tombol Edit membuka modal dengan data pre-filled
   - ✅ Form update RKAM berfungsi
   - ✅ Tombol Delete berfungsi (dengan konfirmasi)
   - ✅ Loading state tampil saat fetch data
   - ✅ Error state tampil jika backend error

### Expected Behavior:

**Scenario 1: Fresh Load**
```
1. Page loads → Shows loading spinner
2. API call to GET /api/rkam
3. Data arrives → Display 6 items from seeder
4. Summary cards show totals:
   - Total Pagu: Rp 235.000.000 (50M + 20M + 15M + 75M + 25M + 30M)
   - Terpakai: Rp 0 (no proposals yet)
   - Sisa: Rp 235.000.000
   - Progress: 0%
```

**Scenario 2: Create RKAM**
```
1. Click "Tambah RKAM"
2. Fill form:
   - Kategori: Pelatihan
   - Nama: Pelatihan IT
   - Pagu: 10000000
   - Tahun: 2025
3. Submit → API POST /api/rkam
4. Success → Modal closes, data refreshes
5. New item appears in table
6. Summary cards update (Total Pagu now Rp 245.000.000)
```

**Scenario 3: Update RKAM**
```
1. Click Edit button on any item
2. Modal opens with pre-filled data
3. Change pagu to 60000000
4. Submit → API PUT /api/rkam/{id}
5. Success → Modal closes, data refreshes
6. Updated item shows new values
7. Summary cards update accordingly
```

**Scenario 4: Delete RKAM**
```
1. Click Delete button on any item
2. Confirmation dialog appears
3. Click OK → API DELETE /api/rkam/{id}
4. Success → Data refreshes
5. Item removed from table
6. Summary cards update
```

**Scenario 5: Search & Filter**
```
1. Type "Gedung" in search box
2. Table filters to show only matching items
3. Select "Renovasi" from kategori dropdown
4. Table shows only Renovasi items
5. Clear search → All items appear again
```

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Error:** `Access to fetch at 'http://127.0.0.1:8000/api/rkam' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:** Update Laravel CORS config (`config/cors.php`):
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173'],
'supports_credentials' => true,
```

---

### Issue 2: Unauthorized (401)
**Error:** `{"message":"Unauthenticated."}`

**Solution:** 
- Check token is stored in localStorage as 'sirangkul_token'
- Re-login to get fresh token
- Check API middleware in routes/api.php

---

### Issue 3: 404 Not Found
**Error:** `GET http://127.0.0.1:8000/api/rkam 404 (Not Found)`

**Solution:**
- Check routes are registered in `routes/api.php`
- Run `php artisan route:list` to verify
- Check RkamController namespace is correct

---

### Issue 4: Computed Attributes Not Showing
**Error:** `terpakai`, `sisa`, `persentase`, `status` are undefined

**Solution:**
- Check `protected $appends` in Rkam model includes all computed attributes
- Verify getter methods (getTerpakaiAttribute, etc.) are defined
- Check relationship `proposals()` is working

---

### Issue 5: Data Type Mismatch
**Error:** Frontend shows NaN or wrong calculations

**Solution:**
- Backend returns decimals as strings: "50000000.00"
- Frontend should parse: `parseFloat(item.pagu)`
- Already handled in current implementation

---

## Success Criteria

All these should work without errors:

- ✅ GET /api/rkam returns 6 seeded items
- ✅ POST /api/rkam creates new item
- ✅ PUT /api/rkam/{id} updates item
- ✅ DELETE /api/rkam/{id} deletes item
- ✅ Computed attributes (terpakai, sisa, persentase, status) are calculated correctly
- ✅ Frontend displays all data correctly
- ✅ Frontend CRUD operations work
- ✅ Search and filter work
- ✅ Loading and error states work
- ✅ Summary cards show correct totals

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Test with real proposals to verify computed attributes
2. ✅ Add role-based access control (only Admin/Bendahara can create/update/delete)
3. ✅ Test proposal creation with RKAM validation (jumlah_pengajuan <= sisa)
4. ✅ Update ProposalSubmission.tsx to reference RKAM
5. ✅ Add budget validation in proposal form
6. ✅ Test full workflow: Create RKAM → Create Proposal → Approve → Check Budget Update

---

**Happy Testing! 🚀**
