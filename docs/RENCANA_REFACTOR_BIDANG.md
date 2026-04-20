# Rencana Refactor Bidang dan Alur Persetujuan

Status dokumen: analisis dan rencana saja, belum eksekusi perubahan kode.

Tanggal analisis: 2026-04-19

Dokumen ini disusun setelah crawl fitur dan alur yang sedang berjalan di frontend `D:\Projects\SIRANGKULLL\sirangkul` dan backend `D:\Projects\SIRANGKULLL\api-sirangkul`, dengan acuan:

- `docs/CHANGE_IMPACT_11_POIN.md`
- `docs/DEPLOY_CHECKLIST_STORAGE_LOKAL.md`
- `docs/FE_BE_CHANGE_FLOW.md`

## Aturan Wajib Saat Eksekusi Nanti

Jika ada perubahan field di database, maka seed harus ikut disesuaikan pada tahap yang sama.

Minimal yang wajib ikut diperbarui:

- migration atau struktur schema yang berubah
- model dan controller yang membaca field baru
- seluruh seeder yang menulis data ke tabel terkait
- data akun demo atau akun uji yang dipakai untuk test flow

Artinya, implementasi nanti tidak boleh berhenti di perubahan schema saja. Setelah field database berubah, data seed juga harus tetap valid untuk kebutuhan login, alur proposal, approval, pembayaran, dan dashboard.

## 1. Tujuan Refactor

Target bisnis yang ingin dicapai:

- Penamaan domain `kategori` / `category` diganti menjadi `bidang`.
- Setiap user `pengusul`, `verifikator`, dan `komite_madrasah` memiliki `bidang`.
- Proposal mengikuti `bidang` dari RKAM yang dipilih.
- Alur approval disesuaikan menjadi:
  - `Pengusul -> Verifikator -> Komite Madrasah -> Kepala Madrasah -> Bendahara`
- Penolakan di `verifikator`, `komite`, dan `kepala` tetap mengembalikan proposal ke `pengusul` dengan alasan penolakan dan saran perbaikan.
- Dashboard Kepala Madrasah nantinya bisa menampilkan ringkasan per bidang.

## 2. Akun Uji yang Akan Dipakai

Ini adalah akun uji yang diminta untuk dipakai pada alur aplikasi:

- `Administrator`
  - Email: `admin@sirangkul.com`
  - Password: `password`
- `Pengusul`
  - Email: `ahmad@madrasah.com`
  - Password: `password`
- `Verifikator`
  - Email: `siti@madrasah.com`
  - Password: `password`
- `Komite Madrasah`
  - Email: `komite@madrasah.com`
  - Password: `password`
- `Kepala Madrasah`
  - Email: `kepala@madrasah.com`
  - Password: `password`
- `Bendahara`
  - Email: `bendahara@madrasah.com`
  - Password: `password`

Catatan penting:

- Seed backend saat ini belum sinkron penuh dengan daftar akun uji di atas.
- `UserSeeder.php` masih membuat akun resmi lain seperti `superadmin@sirangkul.sch.id`, `kamad@sirangkul.sch.id`, `pengusul@sirangkul.sch.id`, dan seterusnya.
- `KomiteUserSeeder.php` juga membuat banyak akun komite tambahan dari file markdown.
- Saat refactor nanti, seed user perlu dirapikan agar sesuai akun uji yang memang akan dipakai.

## 3. Temuan Hasil Crawl Kondisi Saat Ini

### 3.1 Alur proposal yang benar-benar berjalan sekarang

Dari controller backend dan util frontend, alur yang terimplementasi saat ini adalah:

- `Pengusul -> Verifikator -> Kepala Madrasah -> Komite Madrasah -> Bendahara`
- Tahap `Komite Madrasah` hanya muncul jika `requires_committee_approval = true`
- Flag `requires_committee_approval` saat ini ditentukan dari nominal `jumlah_pengajuan > 50.000.000`

Artinya, kondisi aktual belum sesuai dengan alur bisnis terbaru yang Anda jelaskan.

### 3.2 Alur target yang diminta sekarang

Alur target yang Anda tetapkan adalah:

- `Pengusul -> Verifikator -> Komite Madrasah -> Kepala Madrasah -> Bendahara`
- Jika ditolak di `Verifikator`, kembali ke `Pengusul`
- Jika ditolak di `Komite Madrasah`, kembali ke `Pengusul`
- Jika ditolak di `Kepala Madrasah`, kembali ke `Pengusul`

Konsekuensinya:

- Logika `komite hanya untuk nominal > 50 juta` kemungkinan besar tidak relevan lagi.
- Jika semua proposal memang wajib lewat Komite sebelum Kepala, maka `requires_committee_approval` sebaiknya dihapus atau diubah fungsi.

### 3.3 Kondisi user dan access control saat ini

Saat ini user belum memiliki relasi bidang.

Temuan utama:

- Tabel `users` hanya memiliki `email`, `password`, `full_name`, `role`, lalu ditambah `status` dan `is_active` lewat migration terpisah.
- `UserManagement.tsx` saat ini hanya punya field:
  - `full_name`
  - `email`
  - `role`
  - `status`
  - `password`
- `UserController.php` juga belum menerima atau menyimpan `bidang`.
- Belum ada filter data berbasis bidang untuk `pengusul`, `verifikator`, maupun `komite`.

### 3.4 Kondisi mapping komite saat ini

Mapping komite yang ada sekarang masih bersifat sementara dan belum normalisasi database.

Yang berjalan sekarang:

- Frontend memakai `src/config/committeeRkamMapping.ts`
- Scoping proposal untuk `Komite Madrasah` dilakukan lewat `src/utils/proposalWorkflow.ts`
- Pencocokan dilakukan berbasis:
  - email user komite
  - keyword kategori RKAM
  - nama kategori
  - item RKAM
  - judul proposal

Masalahnya:

- Mapping ini hanya hidup di frontend.
- Tidak ada relasi resmi di database.
- Sangat mudah tidak sinkron dengan data RKAM atau user baru.
- Tidak cocok untuk kebutuhan jangka panjang jika bidang bisa ditambah, diubah, atau dihapus.

### 3.5 Kondisi RKAM dan kategori saat ini

Domain `kategori` saat ini masih campuran antara pola lama dan pola transisi baru.

Kondisi aktif yang ditemukan:

- Ada tabel master `categories`
- Ada relasi `rkam.category_id`
- Masih ada string legacy `rkam.kategori`
- Masih ada string legacy `proposals.kategori`
- Banyak halaman frontend masih membaca `rkam.kategori` langsung

Artinya sistem sekarang masih berjalan dengan dua representasi sekaligus:

- Representasi normalisasi: `categories` + `category_id`
- Representasi legacy: string `kategori`

Refactor ke `bidang` akan menyentuh keduanya.

### 3.6 Kondisi dashboard dan reporting saat ini

Dashboard dan reporting belum siap langsung dipakai untuk statistik per bidang.

Temuan:

- `Dashboard.tsx` mengambil summary global dari backend dan daftar proposal terbaru.
- Ringkasan dashboard backend masih global, belum ada breakdown per bidang.
- `Reporting.tsx` masih banyak memakai data mock atau statis, belum jadi sumber kebenaran untuk dashboard Kepala.

Kesimpulan:

- Dashboard Kepala per bidang harus dibangun dari endpoint backend baru atau endpoint existing yang diperluas.
- `Reporting.tsx` tidak boleh dijadikan dasar utama sebelum dipindahkan ke data real.

### 3.7 Kondisi seed dan data lokal saat ini

Data lokal sekarang kemungkinan merupakan campuran antara seed, perubahan manual, dan lapisan kompatibilitas lama.

Temuan penting:

- `RkamSeeder.php` menghapus isi tabel `categories`, tetapi tidak membangun ulang master kategori normalisasi itu.
- `RkamSeeder.php` mengisi RKAM dari `RKAM_2026.md` dan mengandalkan string `kategori`.
- `ProposalSeeder.php` masih memakai kategori dan item lama seperti:
  - `Renovasi`
  - `Pengadaan`
  - `Pelatihan`
- `ProposalSeeder.php` juga masih mengacu ke email seperti `ahmad@madrasah.com`, tetapi struktur seed user aktif belum konsisten penuh dengan itu.
- `KomiteUserSeeder.php` membuat user komite tanpa bidang.

Kesimpulan:

- Refactor ini bukan sekadar rename field.
- Ini juga harus dianggap sebagai cleanup data seed dan normalisasi data lokal.

### 3.8 Risiko teknis pada migration/schema

Ada inkonsistensi riwayat schema yang perlu diperlakukan hati-hati.

Temuan:

- Migration awal membuat tabel `rkams`
- Model `App\\Models\\Rkam` aktif sekarang memakai `$table = 'rkam'`
- Migration yang lebih baru ada yang mengubah `rkams`
- Migration lain ada yang mengubah `rkam`
- `proposals` merujuk ke RKAM lewat migration yang awalnya mengarah ke `rkams`
- Migration `add_category_id_to_rkams_table.php` justru mengubah tabel `rkam`

Artinya:

- Ada jejak historis schema yang tidak bersih.
- Sebelum rename ke `bidang`, perlu audit schema aktual database lokal.
- Strategi migration nanti harus pragmatis dan tidak boleh mengandalkan asumsi nama tabel lama.

## 4. Gap Utama Antara Kondisi Sekarang dan Target

Gap yang harus ditutup:

- Urutan approval masih salah.
- Komite masih conditional, padahal target terbaru mengarah ke tahap wajib sebelum Kepala.
- User belum punya bidang.
- Proposal belum di-route resmi berdasarkan bidang.
- Pengusul belum dibatasi ke RKAM bidangnya.
- Verifikator belum dibatasi ke proposal bidangnya.
- Komite belum dibatasi ke proposal bidangnya lewat database.
- Dashboard Kepala belum punya data per bidang.
- Seed user dan seed proposal belum sinkron dengan akun uji dan struktur data target.
- Terminologi `kategori/category` masih tersebar luas di FE, BE, schema, seed, dan reporting.

## 5. Modul dan File yang Pasti Terdampak

### 5.1 Frontend

Kemungkinan terdampak besar:

- `src/services/api.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/Layout/Sidebar.tsx`
- `src/pages/UserManagement.tsx`
- `src/components/CategoryManagementModal.tsx`
- `src/pages/RKAMManagement.tsx`
- `src/pages/RAKMViewer.tsx`
- `src/pages/ProposalSubmission.tsx`
- `src/components/widgets/ProposalForm.tsx`
- `src/components/widgets/ProposalDetail.tsx`
- `src/components/widgets/ProposalList.tsx`
- `src/pages/MyProposals.tsx`
- `src/pages/ProposalTracking.tsx`
- `src/pages/ApprovalWorkflow.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Reporting.tsx`
- `src/utils/proposalWorkflow.ts`
- `src/config/committeeRkamMapping.ts`

### 5.2 Backend

Kemungkinan terdampak besar:

- `app/Models/User.php`
- `app/Models/Rkam.php`
- `app/Models/Proposal.php`
- `app/Models/Category.php`
- `app/Http/Controllers/UserController.php`
- `app/Http/Controllers/RkamController.php`
- `app/Http/Controllers/ProposalController.php`
- `app/Http/Controllers/PaymentController.php`
- `app/Http/Controllers/CategoryController.php`
- `app/Http/Controllers/ReportingController.php`
- `routes/api.php`

### 5.3 Migration dan Seed

Pasti perlu disentuh atau diaudit:

- `database/migrations/*users*`
- `database/migrations/*categories*`
- `database/migrations/*rkam*`
- `database/migrations/*proposal*`
- `database/seeders/UserSeeder.php`
- `database/seeders/KomiteUserSeeder.php`
- `database/seeders/RkamSeeder.php`
- `database/seeders/ProposalSeeder.php`
- `database/seeders/DatabaseSeeder.php`

## 6. Rekomendasi Desain Target

### 6.1 Terminologi final

Saya rekomendasikan satu istilah final saja:

- `categories` menjadi `bidang`
- `category_id` menjadi `bidang_id`
- `kategori` menjadi `bidang`

Selama transisi implementasi boleh ada alias kompatibilitas, tetapi target akhirnya tetap satu istilah domain: `bidang`.

### 6.2 Model data user

Rekomendasi paling pragmatis untuk fase ini:

- Tambahkan `users.bidang_id` yang nullable
- `bidang_id` wajib untuk role:
  - `pengusul`
  - `verifikator`
  - `komite_madrasah`
- `bidang_id` opsional untuk role:
  - `administrator`
  - `kepala_madrasah`
  - `bendahara`

Alasan rekomendasi `single bidang per user` untuk sekarang:

- Lebih sederhana dari pivot table.
- Sesuai dengan kebutuhan bisnis yang Anda jelaskan saat ini.
- Risiko refactor lebih kecil.
- Query approval, filter dashboard, dan seed user jadi jauh lebih mudah.

Catatan:

- Jika nanti satu user memang boleh memegang lebih dari satu bidang, baru pindah ke pivot table seperti `user_bidang`.
- Untuk tahap sekarang, saya tidak rekomendasikan langsung ke many-to-many jika belum benar-benar dibutuhkan.

### 6.3 Model data RKAM dan proposal

Rekomendasi:

- RKAM memiliki `bidang_id` resmi
- Proposal menyimpan `bidang_id` juga sebagai snapshot saat dibuat
- Nilai `proposal.bidang_id` diambil otomatis dari RKAM yang dipilih

Kenapa proposal perlu snapshot bidang:

- Mempermudah filter dan dashboard
- Aman jika suatu hari RKAM pindah bidang atau diedit
- Lebih jelas untuk histori approval dan reporting

### 6.4 Aturan visibilitas yang diinginkan

Target perilaku:

- `Pengusul`
  - hanya bisa melihat dan memilih RKAM yang sesuai bidangnya
  - hanya bisa membuat proposal pada bidangnya
- `Verifikator`
  - hanya melihat proposal bidangnya
  - memverifikasi proposal bidangnya
- `Komite Madrasah`
  - hanya melihat proposal bidangnya
  - memutuskan proposal bidangnya
- `Kepala Madrasah`
  - melihat semua proposal
  - bisa melihat rekap per bidang
  - memberi keputusan akhir setelah Komite
- `Bendahara`
  - melihat proposal final approved dari semua bidang
- `Administrator`
  - akses global

### 6.5 Aturan workflow yang direkomendasikan

Jika mengikuti arahan bisnis terbaru, workflow final sebaiknya menjadi:

1. `draft`
2. `submitted` menunggu `Verifikator`
3. `verified` atau nama status baru yang lebih tepat untuk antrian `Komite`
4. tahap `Komite Madrasah`
5. tahap `Kepala Madrasah`
6. `final_approved`
7. `payment_processing`
8. `completed`

Catatan penting:

- Status sekarang belum ideal untuk mewakili urutan baru.
- Saat ini `approved` dipakai sebagai tahap setelah Kepala, lalu baru ke Komite.
- Kita mungkin perlu menata ulang arti status, bukan hanya memindahkan role.

Rekomendasi pragmatis:

- Tetap pakai status yang ada jika masih bisa, tetapi ubah maknanya secara konsisten.
- Jika maknanya terlalu membingungkan, buat status baru yang lebih eksplisit.

### 6.6 Nasib `requires_committee_approval`

Ada dua opsi:

- Opsi yang saya rekomendasikan: hapus logika `requires_committee_approval` dan aturan `> 50 juta`, karena alur terbaru menempatkan Komite sebagai tahap wajib.
- Opsi alternatif: pertahankan flag itu jika ternyata hanya proposal tertentu yang tetap perlu Komite.

Berdasarkan penjelasan terbaru Anda, opsi pertama lebih konsisten.

## 7. Rencana Implementasi Bertahap

Rencana kerja yang saya rekomendasikan:

### Tahap 1. Bekukan kontrak bisnis dan penamaan

Yang harus dikunci dulu:

- Istilah final yang dipakai hanya `bidang`
- Komite wajib untuk semua proposal atau tidak
- User per role memegang satu bidang atau lebih
- Pengusul dibatasi ke RKAM bidangnya atau tidak

Rekomendasi saya untuk tahap ini:

- Pakai istilah final `bidang`
- Komite jadi tahap wajib
- Satu user satu bidang dulu
- Pengusul hanya boleh memilih RKAM bidangnya

### Tahap 2. Audit schema aktual database lokal

Karena migration history tidak bersih, sebelum coding besar perlu cek:

- nama tabel RKAM yang benar-benar aktif di database lokal
- apakah `categories` memang terisi atau kosong
- apakah `rkam.category_id` sekarang valid atau banyak null
- apakah `proposals.kategori` dan `rkam.kategori` konsisten

Tahap ini penting agar migration refactor nanti tidak merusak data lokal yang sekarang sedang dipakai.

### Tahap 3. Refactor schema dan data

Target perubahan data:

- buat master `bidang`
- tambahkan `users.bidang_id`
- tambahkan `proposals.bidang_id`
- pastikan RKAM memakai `bidang_id` final
- backfill semua relasi dari data kategori yang ada
- siapkan lapisan alias sementara agar FE tidak langsung putus saat transisi

### Tahap 4. Rapikan seed dan data demo

Target:

- ganti seed `kategori` menjadi `bidang`
- sinkronkan akun uji dengan daftar yang Anda tetapkan
- tambahkan bidang untuk `pengusul`, `verifikator`, dan `komite`
- rapikan `ProposalSeeder.php` yang saat ini masih tertinggal skema lama
- putuskan apakah `KomiteUserSeeder.php` tetap dipakai atau disederhanakan

### Tahap 5. Refactor backend workflow

Perubahan inti backend:

- ubah urutan approval menjadi `Verifikator -> Komite -> Kepala`
- ubah aturan authorization berbasis role + bidang
- ubah queue proposal per role agar membaca `bidang_id`
- hapus ketergantungan pada keyword mapping email komite
- perbarui response proposal agar selalu membawa data bidang
- perbarui endpoint dashboard dan reporting agar bisa agregasi per bidang

### Tahap 6. Refactor frontend

Perubahan inti frontend:

- ubah label UI dari `kategori` menjadi `bidang`
- tambahkan field bidang di form tambah/edit user
- ubah manajemen kategori menjadi manajemen bidang
- ubah filter RKAM dan viewer ke bidang
- batasi pilihan RKAM di halaman pembuatan proposal berdasarkan bidang pengusul
- ubah antrian persetujuan agar berdasarkan bidang dan urutan baru
- hapus `committeeRkamMapping.ts` ketika mapping database sudah siap
- tambah ringkasan bidang di dashboard Kepala

### Tahap 7. Uji end-to-end dan validasi data

Skenario uji minimal nanti:

1. `Pengusul` hanya melihat RKAM bidangnya
2. `Pengusul` membuat proposal dan submit
3. `Verifikator` bidang sama bisa melihat dan memproses
4. `Komite` bidang sama bisa melihat dan memproses
5. `Kepala` bisa melihat semua dan memberi keputusan akhir
6. `Bendahara` memproses pembayaran
7. `Pengusul` melihat status pembayaran selesai
8. Dashboard Kepala menampilkan ringkasan per bidang

Catatan:

- Dokumen `docs/DEPLOY_CHECKLIST_STORAGE_LOKAL.md` tetap harus dijadikan acuan, karena refactor ini masih menyentuh alur file proposal dan bukti pembayaran pada storage lokal.

## 8. Urutan Kerja FE dan BE yang Disarankan

Mengikuti `docs/FE_BE_CHANGE_FLOW.md`, jalur kerja tetap:

1. finalkan dulu kebutuhan UI/UX dan kontrak data yang dibutuhkan FE
2. petakan gap API dan schema
3. implementasi penyesuaian FE
4. lanjut implementasi BE
5. uji integrasi ulang

Namun untuk refactor ini ada pengecualian teknis:

- Karena ada perubahan schema dan backfill data, migration dan compatibility layer backend harus disiapkan sangat awal.
- Jadi praktiknya nanti akan berjalan paralel:
  - kontrak FE ditetapkan dulu
  - schema BE disiapkan agar kontrak baru bisa didukung
  - lalu naming legacy dibersihkan bertahap

## 9. Keputusan yang Perlu Dikunci Sebelum Eksekusi

Hal-hal yang masih perlu kita pastikan sebelum coding:

- Apakah `Komite Madrasah` sekarang benar-benar wajib untuk semua proposal.
- Apakah satu user cukup punya satu bidang atau ada role tertentu yang butuh lebih dari satu bidang.
- Apakah `Pengusul` harus dibatasi penuh ke RKAM bidangnya.
- Apakah Kepala hanya butuh ringkasan per bidang atau juga drilldown daftar proposal per bidang.
- Apakah rename database dilakukan total sekali jalan atau lewat alias transisi sementara.

Rekomendasi saya:

- Komite wajib untuk semua proposal.
- Satu user satu bidang dulu.
- Pengusul dibatasi ke RKAM bidangnya.
- Kepala punya ringkasan per bidang plus akses drilldown.
- Gunakan alias transisi sementara saat implementasi, lalu dibersihkan setelah stabil.

## 10. Kesimpulan

Kesimpulan hasil crawl:

- Fitur saat ini belum selesai untuk kebutuhan `bidang`.
- Mismatch terbesar ada pada:
  - urutan approval
  - tidak adanya bidang pada user
  - mapping komite yang masih frontend-only
  - data seed yang belum bersih
  - terminologi `kategori/category` yang masih tersebar

Refactor ini termasuk kategori menengah ke besar, karena menyentuh:

- schema
- seed
- controller
- model
- halaman form
- approval queue
- dashboard
- reporting

Jadi langkah paling aman berikutnya nanti adalah:

1. kunci keputusan bisnis yang belum final
2. audit schema data lokal yang aktif
3. baru eksekusi refactor bertahap

Dokumen ini menjadi baseline rencana sebelum implementasi dimulai.
