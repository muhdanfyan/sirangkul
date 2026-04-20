# Progress Refactor Bidang

Status: selesai

Tanggal mulai eksekusi: 2026-04-19

## Checklist Utama

- [x] Audit kondisi aktual frontend dan backend
- [x] Buat dokumen rencana refactor
- [x] Tambahkan aturan bahwa perubahan field database wajib diikuti penyesuaian seed
- [x] Implementasi schema dan seed `bidang`
- [x] Implementasi workflow approval baru `Verifikator -> Komite -> Kepala`
- [x] Implementasi filter data berbasis bidang pada user, RKAM, proposal, approval, dan dashboard
- [x] Rapikan istilah UI dari `kategori` ke `bidang`
- [x] Verifikasi build frontend
- [x] Verifikasi integrasi backend

## Log Eksekusi

### 2026-04-19

- Eksekusi dimulai.
- Worktree frontend terdeteksi sudah memiliki perubahan lain di luar task ini, sehingga pengerjaan dilakukan hati-hati tanpa revert perubahan existing.
- Fokus tahap awal ditetapkan ke:
  - menyiapkan progress tracking
  - membangun fondasi data `bidang`
  - merapikan seed saat field database berubah
  - mengubah urutan workflow approval
- Aturan bisnis tambahan dikunci:
  - `Pengusul`, `Verifikator`, dan `Kepala Madrasah` hanya boleh melihat RKAM pada bidangnya
  - `Pengusul` tidak boleh membuat proposal dari RKAM bidang lain
- Migrasi backend `2026_04_19_000001_create_bidangs_table` dan `2026_04_19_000002_add_bidang_columns_to_users_rkam_and_proposals` sudah dijalankan pada database lokal aktif.
- Seeder aman sudah dijalankan ke database lokal aktif:
  - `BidangSeeder`
  - `UserSeeder`
- Verifikasi runtime yang sudah lolos:
  - `npm run build` frontend sukses
  - `php artisan route:list` backend sukses
  - `php -l` untuk controller, model, dan seeder yang disentuh sukses
- Hasil cek database lokal aktif:
  - akun demo utama (`ahmad@madrasah.com`, `siti@madrasah.com`, `komite@madrasah.com`, `kepala@madrasah.com`) sudah memiliki `bidang_id` yang sama
  - seluruh data RKAM aktif sudah memiliki `bidang_id`
- Tahap lanjutan selesai:
  - database lokal sudah dibersihkan penuh dengan `migrate:fresh --seed --force`
  - migration lama yang campur `rkams` dan `rkam` sudah dirapikan agar fresh install berhasil
  - seeder `ProposalSeeder` dan `PaymentSeeder` diperbaiki agar aman untuk field opsional
- Snapshot database lokal aktif setelah reseed penuh:
  - `bidangs`: 4
  - `users`: 7
  - `rkam`: 368
  - `proposals`: 8
  - `payments`: 2
  - `approval_workflows`: 17
  - status proposal seed lengkap masing-masing 1 data:
    - `draft`
    - `submitted`
    - `verified`
    - `approved`
    - `rejected`
    - `final_approved`
    - `payment_processing`
    - `completed`
- Finalisasi bidang terbaru selesai:
  - daftar bidang aktif sekarang hanya `HUMAS`, `Pendidikan`, `Sarana dan Prasarana`, dan `Sekretariat Komite`
  - migration baru `2026_04_19_000003_standardize_bidang_groups` ditambahkan untuk merapikan database lokal existing ke 4 bidang final
  - `RkamSeeder` diperbaiki agar heading RKAM besar tetap tersimpan sebagai item, tetapi klasifikasi `bidang`-nya selalu jatuh ke salah satu dari 4 bidang final
  - hasil audit sebelum perbaikan menunjukkan `261` baris RKAM belum memiliki `bidang_id`; setelah reseed terbaru jumlahnya menjadi `0`
  - hasil verifikasi terbaru:
    - `bidangs` distinct di tabel `rkam`: `HUMAS`, `Pendidikan`, `Sarana dan Prasarana`, `Sekretariat Komite`
    - `proposal` distinct bidang: `Pendidikan`
    - seluruh `proposal` seed memiliki `bidang_id`
  - seed user diperluas untuk mendukung pengujian lintas bidang:
    - total user aktif seed sekarang ditargetkan menjadi `19`
    - akun inti lama tetap dipertahankan untuk `Pendidikan`
    - akun tambahan dibuat untuk `HUMAS`, `Sarana dan Prasarana`, dan `Sekretariat Komite`
    - verifikasi database lokal aktif setelah `UserSeeder` terbaru:
      - `users`: `19`
      - setiap bidang sekarang memiliki masing-masing 1 `pengusul`, 1 `verifikator`, 1 `komite_madrasah`, dan 1 `kepala_madrasah`
  - sumber seed user aktif dikunci di:
    - `../api-sirangkul/database/seeders/UserSeeder.php`
    - `../api-sirangkul/database/seeders/DatabaseSeeder.php`
  - sumber daftar user legacy/nonaktif yang masih tersimpan:
    - `../api-sirangkul/DATABASE_USER_SEEDER.md`
    - `../api-sirangkul/database/seeders/KomiteUserSeeder.php`
    - `docs/PENGURUS_KOMITE_2024_2027.md`
  - build frontend terbaru lolos lagi setelah verifikasi ulang
  - `php artisan route:list` backend terbaru tetap lolos

## Catatan Penting

- Setiap perubahan field database harus langsung diikuti penyesuaian seed.
- Karena backend berada di repo terpisah, perubahan backend harus dijaga sinkron dengan frontend dan dokumentasi.
- Database lokal sekarang sudah berada pada kondisi seed demo baru berbasis bidang.
