# Backend TODO - RKAM Endpoints

## ⚠️ PENTING: Endpoint yang Diperlukan untuk RKAM Management

Saat ini, `RKAMController` hanya menyediakan endpoint yang terikat dengan `proposal_id`. Namun untuk halaman **RKAM Management**, kita memerlukan endpoint tambahan untuk mendapatkan **semua data RKAM**.

### Endpoint yang Dibutuhkan:

#### 1. **GET /api/rkam** - Get All RKAM Items
```php
// Tambahkan di RkamController.php
public function indexAll()
{
    $rkam = Rkam::all();
    return response()->json($rkam);
}
```

**Route yang perlu ditambahkan di `routes/api.php`:**
```php
Route::get('/rkam', [RkamController::class, 'indexAll'])->middleware('auth:sanctum');
```

**Response Example:**
```json
[
  {
    "id": "uuid-1",
    "proposal_id": "uuid-proposal-1",
    "item_name": "Laptop Dell Latitude",
    "quantity": 5,
    "unit_price": 15000000,
    "total_price": 75000000
  },
  {
    "id": "uuid-2",
    "proposal_id": null,
    "item_name": "Proyektor Epson",
    "quantity": 3,
    "unit_price": 8000000,
    "total_price": 24000000
  }
]
```

---

### Catatan Implementasi Frontend:

1. ✅ Interface RKAM sudah dibuat di `src/services/api.ts`
2. ✅ Method `getAllRKAM()` sudah dibuat di `ApiService`
3. ✅ Halaman `RKAMManagement.tsx` sudah menggunakan data dari API
4. ⏳ **Menunggu backend menambahkan endpoint GET /api/rkam**

### Sementara Waktu:

Frontend akan menampilkan pesan "Tidak ada data RKAM" sampai endpoint backend tersedia.

---

### Alternatif Implementasi (jika diperlukan):

Jika RKAM hanya boleh dikelola melalui Proposal, maka:
1. Hapus tombol "Tambah Item RKAM" dari halaman RKAM Management
2. Ubah halaman menjadi **read-only** untuk monitoring saja
3. Semua CRUD RKAM dilakukan di halaman Proposal Submission

Silakan diskusikan dengan tim untuk menentukan approach mana yang lebih sesuai dengan requirement.
