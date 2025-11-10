# Backend TODO: RKAM Refactoring

> **Tanggal dibuat**: 5 November 2025  
> **Branch Frontend**: RKAM-branch  
> **Status**: Menunggu implementasi backend

## 📋 Overview

RKAM (Rencana Kegiatan dan Anggaran Madrasah) harus diubah dari **child of Proposal** menjadi **Master Budget (parent of Proposal)**. Setiap proposal nantinya akan mereferensi RKAM yang sudah ada.

---

## 🎯 Konsep Yang Benar

### **RKAM = Master Budget Tahunan**
- RKAM dibuat di awal tahun anggaran oleh admin/bendahara
- Berisi kategori-kategori anggaran dengan pagu yang sudah ditentukan
- Proposal mengacu ke RKAM dan **tidak boleh melebihi sisa anggaran** yang tersedia

### **Relationship:**
```
RKAM (1) ──→ (Many) Proposals
```

**Contoh:**
- RKAM: "Renovasi Gedung Sekolah" dengan pagu Rp 50.000.000
- Proposal 1: "Renovasi Ruang Kelas 1A" mengajukan Rp 15.000.000 (referensi ke RKAM Renovasi)
- Proposal 2: "Renovasi Toilet" mengajukan Rp 12.000.000 (referensi ke RKAM Renovasi)
- Sisa RKAM Renovasi: Rp 23.000.000

---

## ✅ Checklist Backend Tasks

### **1. Database Migration**

#### [ ] 1.1. Ubah struktur tabel `rkam`

**File**: `database/migrations/YYYY_MM_DD_HHMMSS_modify_rkam_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rkam', function (Blueprint $table) {
            // Hapus kolom yang tidak diperlukan
            $table->dropForeign(['proposal_id']); // Drop foreign key dulu
            $table->dropColumn(['proposal_id', 'quantity', 'unit_price', 'total_price']);
            
            // Tambah kolom baru
            $table->string('kategori'); // Kategori: Renovasi, Pengadaan, Pelatihan, Operasional
            $table->decimal('pagu', 15, 2); // Budget total
            $table->integer('tahun_anggaran')->default(date('Y')); // Tahun anggaran
            $table->text('deskripsi')->nullable(); // Deskripsi detail
            
            // item_name sudah ada, tetap dipertahankan
        });
    }

    public function down(): void
    {
        Schema::table('rkam', function (Blueprint $table) {
            // Rollback
            $table->dropColumn(['kategori', 'pagu', 'tahun_anggaran', 'deskripsi']);
            $table->uuid('proposal_id')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            
            $table->foreign('proposal_id')
                  ->references('id')
                  ->on('proposals')
                  ->onDelete('cascade');
        });
    }
};
```

**Hasil tabel `rkam` setelah migration:**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| kategori | VARCHAR | Kategori anggaran (Renovasi/Pengadaan/Pelatihan/Operasional) |
| item_name | VARCHAR | Nama item RKAM |
| pagu | DECIMAL(15,2) | Budget total |
| tahun_anggaran | INTEGER | Tahun anggaran (2025, 2026, dst) |
| deskripsi | TEXT | Deskripsi detail (nullable) |
| created_at | TIMESTAMP | - |
| updated_at | TIMESTAMP | - |

---

#### [ ] 1.2. Tambahkan kolom `rkam_id` ke tabel `proposals`

**File**: `database/migrations/YYYY_MM_DD_HHMMSS_add_rkam_id_to_proposals.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->uuid('rkam_id')->nullable()->after('user_id');
            
            $table->foreign('rkam_id')
                  ->references('id')
                  ->on('rkam')
                  ->onDelete('restrict'); // Prevent deleting RKAM if there are proposals
        });
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            $table->dropForeign(['rkam_id']);
            $table->dropColumn('rkam_id');
        });
    }
};
```

**Hasil tabel `proposals` setelah migration:**
- Tambah kolom: `rkam_id` (UUID, foreign key to rkam.id)

---

### **2. Eloquent Models**

#### [ ] 2.1. Update Model `Rkam`

**File**: `app/Models/Rkam.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rkam extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'rkam';

    protected $fillable = [
        'kategori',
        'item_name',
        'pagu',
        'tahun_anggaran',
        'deskripsi',
    ];

    protected $casts = [
        'pagu' => 'decimal:2',
        'tahun_anggaran' => 'integer',
    ];

    /**
     * Relationship: RKAM has many Proposals
     */
    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'rkam_id');
    }

    /**
     * Computed attribute: Total terpakai (total dari proposals yang approved)
     */
    public function getTerpakaiAttribute(): float
    {
        return $this->proposals()
                    ->where('status', 'approved') // Hanya hitung yang sudah approved
                    ->sum('jumlah_pengajuan');
    }

    /**
     * Computed attribute: Sisa anggaran
     */
    public function getSisaAttribute(): float
    {
        return $this->pagu - $this->terpakai;
    }

    /**
     * Computed attribute: Persentase penggunaan
     */
    public function getPersentaseAttribute(): float
    {
        if ($this->pagu <= 0) {
            return 0;
        }
        return ($this->terpakai / $this->pagu) * 100;
    }

    /**
     * Computed attribute: Status (Normal/Warning/Critical)
     */
    public function getStatusAttribute(): string
    {
        $persentase = $this->persentase;
        
        if ($persentase >= 90) {
            return 'Critical';
        } elseif ($persentase >= 75) {
            return 'Warning';
        }
        
        return 'Normal';
    }

    /**
     * Append computed attributes to JSON
     */
    protected $appends = ['terpakai', 'sisa', 'persentase', 'status'];
}
```

---

#### [ ] 2.2. Update Model `Proposal`

**File**: `app/Models/Proposal.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    protected $fillable = [
        'rkam_id',      // Tambahkan ini
        'user_id',
        'title',
        'description',
        'jumlah_pengajuan',
        'status',
        // ... fillable lainnya
    ];

    protected $casts = [
        'jumlah_pengajuan' => 'decimal:2',
    ];

    /**
     * Relationship: Proposal belongs to RKAM
     */
    public function rkam()
    {
        return $this->belongsTo(Rkam::class, 'rkam_id');
    }

    /**
     * Relationship: Proposal belongs to User (yang membuat proposal)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

### **3. API Controllers**

#### [ ] 3.1. Buat `RkamController`

**File**: `app/Http/Controllers/Api/RkamController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rkam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RkamController extends Controller
{
    /**
     * GET /api/rkam
     * List semua RKAM (dengan computed attributes)
     */
    public function index(Request $request)
    {
        $query = Rkam::query();

        // Filter by kategori
        if ($request->has('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        // Filter by tahun_anggaran
        if ($request->has('tahun_anggaran')) {
            $query->where('tahun_anggaran', $request->tahun_anggaran);
        }

        // Search by item_name
        if ($request->has('search')) {
            $query->where('item_name', 'like', '%' . $request->search . '%');
        }

        $rkamList = $query->orderBy('created_at', 'desc')->get();

        return response()->json($rkamList, 200);
    }

    /**
     * GET /api/rkam/{id}
     * Get detail RKAM dengan list proposals yang terkait
     */
    public function show($id)
    {
        $rkam = Rkam::with('proposals')->findOrFail($id);

        return response()->json($rkam, 200);
    }

    /**
     * POST /api/rkam
     * Create RKAM baru
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kategori' => 'required|string|in:Renovasi,Pengadaan,Pelatihan,Operasional',
            'item_name' => 'required|string|max:255',
            'pagu' => 'required|numeric|min:0',
            'tahun_anggaran' => 'required|integer|min:2020|max:2100',
            'deskripsi' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $rkam = Rkam::create($validator->validated());

        return response()->json([
            'message' => 'RKAM created successfully',
            'data' => $rkam
        ], 201);
    }

    /**
     * PUT /api/rkam/{id}
     * Update RKAM
     */
    public function update(Request $request, $id)
    {
        $rkam = Rkam::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'kategori' => 'sometimes|required|string|in:Renovasi,Pengadaan,Pelatihan,Operasional',
            'item_name' => 'sometimes|required|string|max:255',
            'pagu' => 'sometimes|required|numeric|min:0',
            'tahun_anggaran' => 'sometimes|required|integer|min:2020|max:2100',
            'deskripsi' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $rkam->update($validator->validated());

        return response()->json([
            'message' => 'RKAM updated successfully',
            'data' => $rkam
        ], 200);
    }

    /**
     * DELETE /api/rkam/{id}
     * Delete RKAM (hanya jika tidak ada proposal yang terkait)
     */
    public function destroy($id)
    {
        $rkam = Rkam::findOrFail($id);

        // Check if there are proposals linked to this RKAM
        if ($rkam->proposals()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete RKAM. There are proposals linked to this RKAM.',
            ], 400);
        }

        $rkam->delete();

        return response()->json([
            'message' => 'RKAM deleted successfully'
        ], 200);
    }

    /**
     * GET /api/rkam/{id}/proposals
     * Get all proposals for a specific RKAM
     */
    public function proposals($id)
    {
        $rkam = Rkam::with('proposals.user')->findOrFail($id);

        return response()->json([
            'rkam' => $rkam,
            'proposals' => $rkam->proposals
        ], 200);
    }
}
```

---

#### [ ] 3.2. Update `ProposalController`

**File**: `app/Http/Controllers/Api/ProposalController.php`

**Tambahkan validasi di method `store()` dan `update()`:**

```php
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'rkam_id' => 'required|exists:rkam,id', // RKAM harus ada
        'title' => 'required|string|max:255',
        'jumlah_pengajuan' => 'required|numeric|min:0',
        // ... validasi lainnya
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // Validasi: Jumlah pengajuan tidak boleh melebihi sisa RKAM
    $rkam = Rkam::findOrFail($request->rkam_id);
    
    if ($request->jumlah_pengajuan > $rkam->sisa) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => [
                'jumlah_pengajuan' => [
                    "Jumlah pengajuan (Rp " . number_format($request->jumlah_pengajuan, 0, ',', '.') . 
                    ") melebihi sisa anggaran RKAM (Rp " . number_format($rkam->sisa, 0, ',', '.') . ")"
                ]
            ]
        ], 422);
    }

    $proposal = Proposal::create($validator->validated());

    return response()->json([
        'message' => 'Proposal created successfully',
        'data' => $proposal->load('rkam')
    ], 201);
}
```

---

### **4. API Routes**

#### [ ] 4.1. Tambahkan routes untuk RKAM

**File**: `routes/api.php`

```php
use App\Http\Controllers\Api\RkamController;

Route::middleware('auth:sanctum')->group(function () {
    
    // RKAM Routes
    Route::get('/rkam', [RkamController::class, 'index']);
    Route::get('/rkam/{id}', [RkamController::class, 'show']);
    Route::post('/rkam', [RkamController::class, 'store']); // Admin/Bendahara only
    Route::put('/rkam/{id}', [RkamController::class, 'update']); // Admin/Bendahara only
    Route::delete('/rkam/{id}', [RkamController::class, 'destroy']); // Admin only
    Route::get('/rkam/{id}/proposals', [RkamController::class, 'proposals']);

    // Existing Proposal Routes
    // ...
});
```

**⚠️ Catatan Security:** Tambahkan middleware untuk role-based access:
- `POST /api/rkam` → Hanya Admin & Bendahara
- `PUT /api/rkam/{id}` → Hanya Admin & Bendahara
- `DELETE /api/rkam/{id}` → Hanya Admin

---

### **5. Database Seeder**

#### [ ] 5.1. Buat `RkamSeeder`

**File**: `database/seeders/RkamSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rkam;

class RkamSeeder extends Seeder
{
    public function run(): void
    {
        $rkamData = [
            [
                'kategori' => 'Renovasi',
                'item_name' => 'Renovasi Gedung Sekolah',
                'pagu' => 50000000,
                'tahun_anggaran' => 2025,
                'deskripsi' => 'Renovasi gedung utama termasuk atap dan lantai',
            ],
            [
                'kategori' => 'Pengadaan',
                'item_name' => 'Pengadaan Proyektor',
                'pagu' => 20000000,
                'tahun_anggaran' => 2025,
                'deskripsi' => 'Pengadaan proyektor untuk setiap kelas',
            ],
            [
                'kategori' => 'Pelatihan',
                'item_name' => 'Pelatihan Guru',
                'pagu' => 15000000,
                'tahun_anggaran' => 2025,
                'deskripsi' => 'Pelatihan metode mengajar modern untuk semua guru',
            ],
            [
                'kategori' => 'Pengadaan',
                'item_name' => 'Pengadaan Komputer Lab',
                'pagu' => 75000000,
                'tahun_anggaran' => 2025,
                'deskripsi' => 'Pengadaan 30 unit komputer untuk laboratorium komputer',
            ],
            [
                'kategori' => 'Renovasi',
                'item_name' => 'Perbaikan Sanitasi',
                'pagu' => 25000000,
                'tahun_anggaran' => 2025,
                'deskripsi' => 'Perbaikan toilet dan sistem sanitasi sekolah',
            ],
        ];

        foreach ($rkamData as $data) {
            Rkam::create($data);
        }
    }
}
```

**Run seeder:**
```bash
php artisan db:seed --class=RkamSeeder
```

---

### **6. Testing**

#### [ ] 6.1. Test API Endpoints

**Gunakan Postman/cURL untuk testing:**

**1. Get All RKAM:**
```bash
GET http://127.0.0.1:8000/api/rkam
Authorization: Bearer {token}
```

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "kategori": "Renovasi",
    "item_name": "Renovasi Gedung Sekolah",
    "pagu": "50000000.00",
    "tahun_anggaran": 2025,
    "deskripsi": "Renovasi gedung utama...",
    "terpakai": "15000000.00",
    "sisa": "35000000.00",
    "persentase": 30,
    "status": "Normal",
    "created_at": "2025-11-05T10:00:00.000000Z",
    "updated_at": "2025-11-05T10:00:00.000000Z"
  }
]
```

**2. Create RKAM:**
```bash
POST http://127.0.0.1:8000/api/rkam
Authorization: Bearer {token}
Content-Type: application/json

{
  "kategori": "Operasional",
  "item_name": "Operasional Bulanan",
  "pagu": 30000000,
  "tahun_anggaran": 2025,
  "deskripsi": "Biaya operasional rutin sekolah"
}
```

**3. Create Proposal dengan RKAM:**
```bash
POST http://127.0.0.1:8000/api/proposals
Authorization: Bearer {token}
Content-Type: application/json

{
  "rkam_id": "uuid-from-rkam",
  "title": "Renovasi Ruang Kelas 1A",
  "description": "Renovasi cat dan perbaikan meja kursi",
  "jumlah_pengajuan": 15000000
}
```

**Expected:** Success jika jumlah_pengajuan <= sisa RKAM

**4. Test Validation - Melebihi Budget:**
```bash
POST http://127.0.0.1:8000/api/proposals

{
  "rkam_id": "uuid-from-rkam",
  "jumlah_pengajuan": 999999999  // Lebih besar dari sisa RKAM
}
```

**Expected:** Error 422 dengan message "melebihi sisa anggaran RKAM"

---

### **7. Data Migration (Existing Data)**

#### [ ] 7.1. Migrasi data RKAM yang sudah ada

**Jika sudah ada data RKAM lama, buat script untuk migrasi:**

**File**: `database/seeders/MigrateOldRkamSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MigrateOldRkamSeeder extends Seeder
{
    public function run(): void
    {
        // Backup old RKAM data before migration
        $oldRkam = DB::table('rkam_backup')->get(); // Assuming you backed up old data
        
        foreach ($oldRkam as $old) {
            DB::table('rkam')->insert([
                'id' => $old->id,
                'kategori' => 'Pengadaan', // Set default category or map from old data
                'item_name' => $old->item_name,
                'pagu' => $old->total_price,
                'tahun_anggaran' => 2025,
                'deskripsi' => "Migrated from old system - Qty: {$old->quantity}, Unit Price: {$old->unit_price}",
                'created_at' => $old->created_at,
                'updated_at' => now(),
            ]);
        }
    }
}
```

---

### **8. Documentation**

#### [ ] 8.1. Update API Documentation

Tambahkan dokumentasi API endpoints untuk RKAM di Postman/Swagger:

- `GET /api/rkam` - List all RKAM
- `GET /api/rkam/{id}` - Get RKAM detail
- `POST /api/rkam` - Create RKAM
- `PUT /api/rkam/{id}` - Update RKAM
- `DELETE /api/rkam/{id}` - Delete RKAM
- `GET /api/rkam/{id}/proposals` - Get proposals for RKAM

#### [ ] 8.2. Update README

Tambahkan dokumentasi tentang konsep RKAM di README project.

---

## 🔄 Alur Kerja Setelah Refactor

### **Scenario: Pembuatan Proposal**

1. Admin/Bendahara membuat RKAM di awal tahun:
   ```
   POST /api/rkam
   {
     "kategori": "Renovasi",
     "item_name": "Renovasi Gedung Sekolah",
     "pagu": 50000000,
     "tahun_anggaran": 2025
   }
   ```

2. User biasa membuat proposal yang referensi ke RKAM:
   ```
   POST /api/proposals
   {
     "rkam_id": "uuid-dari-rkam-renovasi",
     "title": "Renovasi Ruang Kelas 1A",
     "jumlah_pengajuan": 15000000
   }
   ```

3. Backend validasi: `15000000 <= sisa RKAM?` → ✅ Success

4. Setelah proposal approved, field `terpakai` di RKAM otomatis ter-update (via computed attribute)

5. Frontend RKAM Management menampilkan:
   - Pagu: Rp 50.000.000
   - Terpakai: Rp 15.000.000
   - Sisa: Rp 35.000.000
   - Status: Normal (30%)

---

## 📝 Notes untuk Backend Developer

1. **Jangan hapus tabel lama dulu** - Backup dulu data RKAM yang existing
2. **Run migration step-by-step** - Test setiap migration sebelum lanjut
3. **Computed attributes penting** - Frontend butuh: terpakai, sisa, persentase, status
4. **Validation ketat** - Proposal tidak boleh melebihi sisa RKAM
5. **Role-based access** - Create/Update/Delete RKAM hanya untuk Admin/Bendahara
6. **Test dengan data real** - Pastikan computed attributes bekerja dengan benar

---

## 🚀 Urutan Eksekusi

Jalankan tasks dalam urutan ini:

1. ✅ Backup database existing
2. ✅ Run migration 1.1 (modify rkam table)
3. ✅ Run migration 1.2 (add rkam_id to proposals)
4. ✅ Update Model Rkam (2.1)
5. ✅ Update Model Proposal (2.2)
6. ✅ Create RkamController (3.1)
7. ✅ Update ProposalController (3.2)
8. ✅ Add Routes (4.1)
9. ✅ Run RkamSeeder (5.1)
10. ✅ Testing (6.1)
11. ✅ Update Documentation (8.1 & 8.2)

---

## 📞 Contact

Jika ada pertanyaan tentang struktur frontend atau kebutuhan API, hubungi:
- **Frontend Developer**: [Your Name]
- **Branch**: RKAM-branch
- **File Reference**: `src/pages/RKAMManagement.tsx`

---

## 🎉 Setelah Selesai

Setelah backend refactor selesai dan tested:

1. Frontend akan re-integrate dengan API (mengganti dummy data dengan API calls)
2. Test full flow: Create RKAM → Create Proposal → Approval → Check Budget Update
3. Deploy ke staging untuk UAT

**Good luck! 🚀**
