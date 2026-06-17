# Implementasi Formula RKAM Dana BOS dan Dana Komite

Dokumen ini adalah spesifikasi eksekusi untuk mengubah perhitungan RKAM sesuai konfirmasi client.

Tag eksekusi yang disarankan:

```text
IMPLEMENTASI-RKAM-FORMULA-DANA-BOS-KOMITE
```

Saat tag ini dieksekusi, implementasi harus mengikuti dokumen ini sebagai sumber kebenaran.

## 1. Keputusan Bisnis Final

Client mengonfirmasi bahwa `pagu` RKAM bukan input bebas dan bukan nilai yang dikurangi oleh `Dana BOS` atau `Dana Komite`.

Formula final yang wajib dipakai di frontend, backend, summary, print, dan test:

```text
Harga Satuan = Dana BOS + Dana Komite
Total Pagu = Harga Satuan x Volume
```

Contoh:

```text
Volume: 2
Dana BOS: 100.000
Dana Komite: 100.000
Harga Satuan: 200.000
Total Pagu: 400.000
```

## 2. Konsep Field

Field `harga satuan` tetap ada secara konsep dan tetap boleh disimpan di database sebagai `unit_price`, tetapi tidak boleh diinput manual oleh user.

Makna field setelah implementasi:

| Field | Makna Baru | Input User |
| :--- | :--- | :--- |
| `volume` | Jumlah kebutuhan item RKAM | Ya |
| `satuan` | Label volume, misalnya `Bulan`, `Paket`, `Kegiatan` | Ya |
| `dana_bos` | Nilai Dana BOS pembentuk harga satuan | Ya |
| `dana_komite` | Nilai Dana Komite pembentuk harga satuan | Ya |
| `unit_price` | Harga satuan otomatis dari `dana_bos + dana_komite` | Tidak |
| `pagu` | Total pagu otomatis dari `volume x unit_price` | Tidak |

## 3. Dampak Pada Proposal

Pengurangan dana saat pembuatan/proses proposal tetap berasal dari total pagu RKAM yang dipilih.

Sumber limit proposal:

```text
sisa RKAM = pagu RKAM - total proposal yang sudah terealisasi/terkunci
```

Proposal tidak perlu memilih apakah menggunakan BOS atau Komite.

Validasi over-budget proposal tetap memakai total sisa RKAM, bukan sisa per sumber dana.

Status proposal yang dihitung sebagai pemakaian anggaran mengikuti perilaku existing:

```text
final_approved
payment_processing
completed
```

Jika nanti client meminta pengurangan per sumber dana, itu adalah fitur baru terpisah dan membutuhkan desain tambahan.

## 4. Perubahan Frontend

File utama:

```text
src/pages/RKAMManagement.tsx
```

### 4.1 Modal Tambah/Edit RKAM

Ubah form modal menjadi:

1. `Nama Item / Uraian`
2. `Bidang`
3. `Volume`
4. `Satuan Volume`
5. `Dana BOS (Rp)`
6. `Dana Komite (Rp)`
7. `Harga Satuan (Auto)`
8. `Total Pagu (Auto)`

Input `Harga Satuan (Rp)` manual harus dihapus atau dibuat readonly.

Readonly display:

```text
Harga Satuan (Auto) = Dana BOS + Dana Komite
Total Pagu (Auto) = Volume x Harga Satuan
```

### 4.2 State Form

`formData.unit_price` tidak perlu diedit user, tetapi boleh tetap disimpan di state sebagai hasil kalkulasi.

Rekomendasi:

```ts
const computedUnitPrice = Number(danaBosRaw) + Number(danaKomiteRaw);
const computedPagu = Number(volume) * computedUnitPrice;
```

Saat submit, payload harus mengirim:

```ts
{
  volume: Number(volume),
  satuan,
  dana_bos: Number(danaBosRaw),
  dana_komite: Number(danaKomiteRaw),
  unit_price: computedUnitPrice,
}
```

Catatan: `pagu` tidak perlu dikirim dari frontend. Backend harus menghitung ulang.

### 4.3 Formatting Nominal

Input nominal harus tetap auto-format ribuan saat diketik:

```text
1000000 -> 1.000.000
```

Field yang diformat:

```text
Dana BOS
Dana Komite
```

`Harga Satuan (Auto)` dan `Total Pagu (Auto)` cukup memakai formatter display `formatIDR`.

### 4.4 Validasi UI

Frontend harus menolak submit jika:

```text
volume <= 0
dana_bos < 0
dana_komite < 0
dana_bos + dana_komite <= 0
computedPagu <= 0
```

Pesan yang disarankan:

```text
Total Dana BOS dan Dana Komite harus lebih dari 0.
```

### 4.5 Tabel RKAM

Tabel tetap menampilkan:

```text
Pagu (Total)
Terpakai
Sisa
Penyerapan
```

Subteks item disarankan berubah dari:

```text
{volume} {satuan} @ {unit_price}
```

menjadi:

```text
{volume} {satuan} x ({Dana BOS} BOS + {Dana Komite} Komite)
```

Atau versi pendek:

```text
{volume} {satuan} @ {Harga Satuan}
```

Keduanya valid, tetapi versi pertama lebih menjelaskan asal harga satuan.

## 5. Perubahan Backend

File utama:

```text
app/Http/Controllers/RkamController.php
```

### 5.1 Store RKAM

Backend harus menganggap `unit_price` dari request sebagai tidak dipercaya.

Validasi request:

```php
'volume' => 'required|numeric|min:0.01',
'satuan' => 'required|string|max:50',
'dana_bos' => 'required|numeric|min:0',
'dana_komite' => 'required|numeric|min:0',
'tahun_anggaran' => 'required|integer|min:2020|max:2100',
```

Setelah validasi:

```php
$danaBos = (float) $data['dana_bos'];
$danaKomite = (float) $data['dana_komite'];
$unitPrice = $danaBos + $danaKomite;
$pagu = (float) $data['volume'] * $unitPrice;

if ($unitPrice <= 0) {
    return response()->json([
        'success' => false,
        'message' => 'Total Dana BOS dan Dana Komite harus lebih dari 0.',
    ], 422);
}

$data['unit_price'] = $unitPrice;
$data['pagu'] = $pagu;
```

### 5.2 Update RKAM

Pada update, jika salah satu dari field berikut berubah:

```text
volume
dana_bos
dana_komite
```

maka backend harus hitung ulang:

```php
$volume = (float) ($data['volume'] ?? $rkam->volume);
$danaBos = (float) ($data['dana_bos'] ?? $rkam->dana_bos);
$danaKomite = (float) ($data['dana_komite'] ?? $rkam->dana_komite);
$unitPrice = $danaBos + $danaKomite;

$data['unit_price'] = $unitPrice;
$data['pagu'] = $volume * $unitPrice;
```

Jika RKAM sudah punya proposal terkait, update yang menurunkan `pagu` di bawah total pemakaian harus ditolak.

Validasi wajib:

```php
$realization = $rkam->proposals()
    ->whereIn('status', ['final_approved', 'payment_processing', 'completed'])
    ->sum('jumlah_pengajuan');

if ($newPagu < $realization) {
    return response()->json([
        'success' => false,
        'message' => 'Pagu baru tidak boleh lebih kecil dari anggaran yang sudah terpakai.',
    ], 422);
}
```

### 5.3 Backward Compatibility API

Jika masih ada client lama yang mengirim `unit_price`, backend tetap harus mengabaikan nilai itu dan menghitung dari `dana_bos + dana_komite`.

Jika request lama tidak mengirim `dana_bos` dan `dana_komite`, request boleh ditolak `422`. Ini lebih aman daripada membuat angka sumber dana tidak jelas.

## 6. Summary RKAM

Summary saat ini tidak boleh lagi memakai:

```php
sum(dana_bos)
sum(dana_komite)
```

Karena `dana_bos` dan `dana_komite` sekarang adalah komponen pembentuk harga satuan.

Summary baru:

```text
Total Pagu = sum(pagu)
Total Dana BOS = sum(volume x dana_bos)
Total Dana Komite = sum(volume x dana_komite)
```

Contoh:

```text
Item A:
Volume = 2
Dana BOS = 100.000
Dana Komite = 50.000

Kontribusi summary:
Total Pagu += 300.000
Total Dana BOS += 200.000
Total Dana Komite += 100.000
```

File yang perlu dicek:

```text
app/Http/Controllers/RkamController.php
src/pages/RKAMManagement.tsx
src/pages/RKAMPrintTemplate.tsx
```

Jika `RKAMPrintTemplate` menampilkan BOS/Komite, label harus menjelaskan apakah yang ditampilkan adalah komponen harga satuan atau total sumber dana.

Rekomendasi print/report:

```text
Dana BOS Total = Volume x Dana BOS
Dana Komite Total = Volume x Dana Komite
```

## 7. Data Existing dan Migrasi

Karena data existing mungkin dibuat dengan konsep lama, perlu backfill lokal sebelum deploy production.

### 7.1 Audit Data Existing

Jalankan query audit di backend:

```bash
php artisan tinker --execute="App\Models\Rkam::query()->select('id','item_name','volume','unit_price','dana_bos','dana_komite','pagu')->limit(20)->get()->each(fn($r)=>print($r->id.' | '.$r->item_name.' | volume='.$r->volume.' | unit='.$r->unit_price.' | bos='.$r->dana_bos.' | komite='.$r->dana_komite.' | pagu='.$r->pagu.PHP_EOL));"
```

### 7.2 Backfill Aman

Jika data lama punya `unit_price` benar tetapi `dana_bos + dana_komite` tidak sama dengan `unit_price`, jangan otomatis mengubah semua data tanpa konfirmasi client.

Pilihan backfill:

1. Jika `dana_bos + dana_komite == unit_price`, biarkan.
2. Jika `dana_bos == 0` dan `dana_komite == 0`, isi `dana_bos = unit_price`, `dana_komite = 0`.
3. Jika `dana_bos + dana_komite != unit_price` dan keduanya tidak nol, buat laporan audit untuk client, jangan ubah otomatis.

Script backfill sebaiknya dry-run dulu:

```text
php artisan rkam:audit-source-allocation
php artisan rkam:backfill-source-allocation --dry-run
php artisan rkam:backfill-source-allocation
```

Jika command belum ada, buat command Laravel baru:

```text
app/Console/Commands/AuditRkamSourceAllocationCommand.php
app/Console/Commands/BackfillRkamSourceAllocationCommand.php
```

## 8. Test Wajib

Tambahkan atau update test feature:

```text
tests/Feature/RkamManagementContractTest.php
```

### 8.1 Create RKAM Menghitung Formula Baru

Input:

```json
{
  "volume": 2,
  "satuan": "Paket",
  "dana_bos": 100000,
  "dana_komite": 50000
}
```

Expected:

```text
unit_price = 150000
pagu = 300000
```

### 8.2 Update RKAM Menghitung Ulang

Existing:

```text
volume = 2
dana_bos = 100000
dana_komite = 50000
pagu = 300000
```

Update:

```text
dana_komite = 100000
```

Expected:

```text
unit_price = 200000
pagu = 400000
```

### 8.3 Unit Price Dari Request Diabaikan

Request:

```json
{
  "volume": 2,
  "dana_bos": 100000,
  "dana_komite": 50000,
  "unit_price": 999999999
}
```

Expected:

```text
unit_price = 150000
pagu = 300000
```

### 8.4 Summary Menggunakan Total Sumber Dana

Buat RKAM:

```text
volume = 2
dana_bos = 100000
dana_komite = 50000
```

Expected summary:

```text
totalBudget = 300000
totalDanaBos = 200000
totalDanaKomite = 100000
```

### 8.5 Tidak Bisa Menurunkan Pagu Di Bawah Realisasi

Jika sudah ada proposal terkait dengan status:

```text
completed
```

dan total `jumlah_pengajuan = 500000`, update RKAM yang membuat `pagu < 500000` harus ditolak `422`.

## 9. Test Manual Wajib

Jalankan lokal:

```bash
npm run typecheck
npm run build
php artisan test --filter=RkamManagementContractTest --do-not-cache-result
php artisan test --filter=FullApprovalWorkflowTest --do-not-cache-result
```

Manual UI `/rkam`:

1. Login sebagai Administrator atau Bendahara.
2. Buka `/rkam`.
3. Klik `Tambah RKAM`.
4. Isi:

```text
Volume = 2
Satuan = Paket
Dana BOS = 100.000
Dana Komite = 50.000
```

5. Pastikan:

```text
Harga Satuan Auto = Rp150.000
Total Pagu Auto = Rp300.000
```

6. Simpan.
7. Pastikan tabel menampilkan pagu `Rp300.000`.
8. Buat proposal dari RKAM tersebut dengan `jumlah_pengajuan <= 300.000`.
9. Pastikan proposal berhasil.
10. Buat proposal dengan `jumlah_pengajuan > sisa RKAM`.
11. Pastikan ditolak `422`.

## 10. Acceptance Criteria

Implementasi dianggap selesai jika:

1. User tidak bisa input `Harga Satuan` manual.
2. `Harga Satuan` selalu otomatis dari `Dana BOS + Dana Komite`.
3. `Pagu` selalu otomatis dari `Volume x Harga Satuan`.
4. Backend menghitung ulang `unit_price` dan `pagu`, tidak percaya nilai dari frontend.
5. Summary `Dana BOS` memakai `sum(volume x dana_bos)`.
6. Summary `Dana Komite` memakai `sum(volume x dana_komite)`.
7. Proposal tetap mengurangi/memakai total sisa pagu RKAM.
8. Update RKAM tidak bisa membuat pagu lebih kecil dari realisasi existing.
9. Test feature RKAM mencakup create, update, summary, request tampering, dan realisasi.
10. Build frontend dan test backend lulus.

## 11. Risiko dan Hal Yang Perlu Dikonfirmasi Sebelum Production

Sebelum deploy production, wajib audit data existing karena field `dana_bos` dan `dana_komite` sebelumnya mungkin dipakai sebagai total sumber dana, bukan komponen harga satuan.

Hal yang harus dikonfirmasi dari data production:

1. Apakah nilai `dana_bos` existing saat ini komponen harga satuan atau total.
2. Apakah nilai `dana_komite` existing saat ini komponen harga satuan atau total.
3. Apakah `unit_price` existing dapat dijadikan sumber fallback untuk backfill.
4. Apakah data lama boleh otomatis dikonversi atau harus dibuat laporan untuk koreksi manual.

Jangan deploy perubahan formula ke production sebelum audit data ini selesai.

## 12. Rollback

Jika perlu rollback:

1. Kembalikan UI agar `unit_price` bisa diinput manual.
2. Kembalikan backend agar `pagu = volume x unit_price`.
3. Kembalikan summary agar `totalDanaBos = sum(dana_bos)` dan `totalDanaKomite = sum(dana_komite)`.
4. Jangan rollback data tanpa backup karena data baru setelah formula ini memiliki makna `dana_bos` dan `dana_komite` sebagai komponen harga satuan.
