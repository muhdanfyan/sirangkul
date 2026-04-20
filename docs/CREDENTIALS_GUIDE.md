# Credentials Guide SiRangkul

> **PERINGATAN**: Jangan pernah commit kredensial asli ke public repository. Dokumen ini hanya berisi username dummy/standar untuk keperluan Development dan E2E Testing.

## Lingkungan Local / Testing (VPS & Docker)

Berikut adalah daftar akun utama yang digunakan pada aplikasi SiRangkul untuk pengujian fungsional, pengujian alur role, dan simulasi end-to-end. Gunakan kredensial ini saat menjalankan skenario RBAC maupun pengujian flow bisnis aplikasi.

| Role (Jabatan) | Email | Password | Kegunaan Utama dalam Testing |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sirangkul.com` | `password` | Manajemen user, buat RKAM, dashboard global. |
| **Pengusul (Guru)** | `ahmad@madrasah.com` | `password` | Buat draf proposal dan upload lampiran. |
| **Verifikator** | `siti@madrasah.com` | `password` | Review proposal dan ACC Tahap 1. |
| **Komite Madrasah** | `komite@madrasah.com` | `password` | Review dan ACC Tahap 2 (Komite). |
| **Kepala Madrasah** | `kepala@madrasah.com` | `password` | ACC Final (Mutlak). |
| **Bendahara** | `bendahara@madrasah.com` | `password` | Input realisasi kas dan upload bukti bayar. |

## Akun Bidang Tambahan

Akun di bawah ini disediakan agar alur berbasis bidang bisa diuji pada keempat bidang final tanpa harus membuat user manual dari dashboard.

Semua akun tambahan menggunakan password yang sama: `password`

| Bidang | Role | Email |
| :--- | :--- | :--- |
| **HUMAS** | Pengusul | `pengusul.humas@madrasah.com` |
| **HUMAS** | Verifikator | `verifikator.humas@madrasah.com` |
| **HUMAS** | Komite Madrasah | `komite.humas@madrasah.com` |
| **HUMAS** | Kepala Madrasah | `kepala.humas@madrasah.com` |
| **Sarana dan Prasarana** | Pengusul | `pengusul.sarpras@madrasah.com` |
| **Sarana dan Prasarana** | Verifikator | `verifikator.sarpras@madrasah.com` |
| **Sarana dan Prasarana** | Komite Madrasah | `komite.sarpras@madrasah.com` |
| **Sarana dan Prasarana** | Kepala Madrasah | `kepala.sarpras@madrasah.com` |
| **Sekretariat Komite** | Pengusul | `pengusul.sekretariat@madrasah.com` |
| **Sekretariat Komite** | Verifikator | `verifikator.sekretariat@madrasah.com` |
| **Sekretariat Komite** | Komite Madrasah | `komite.sekretariat@madrasah.com` |
| **Sekretariat Komite** | Kepala Madrasah | `kepala.sekretariat@madrasah.com` |

Catatan:
- Akun inti lama tetap dipertahankan dan saat ini merepresentasikan bidang `Pendidikan`.
- `Administrator`, `Bendahara`, dan `Superadmin` tetap akun global, tidak dibatasi ke satu bidang.

## Alur Role yang Digunakan di Aplikasi

Daftar akun di atas dipakai mengikuti flow operasional berikut:

1. **Administrator**
   Menyiapkan data awal aplikasi seperti user, RKAM, dan kebutuhan dashboard global.
2. **Pengusul (Guru)**
   Membuat draft proposal lalu mengunggah lampiran yang dibutuhkan.
3. **Verifikator**
   Melakukan review proposal dan memberikan ACC Tahap 1.
4. **Komite Madrasah**
   Melakukan review lanjutan dan memberikan ACC Tahap 2 dari sisi komite.
5. **Kepala Madrasah**
   Memberikan ACC Final yang bersifat mutlak.
6. **Bendahara**
   Menginput realisasi kas dan mengunggah bukti bayar setelah proposal selesai disetujui.

## Ringkasan Flow Approval

Flow bisnis yang dicatat untuk penggunaan aplikasi saat ini adalah:

`Administrator (setup data)` -> `Pengusul` -> `Verifikator` -> `Komite Madrasah` -> `Kepala Madrasah` -> `Bendahara`

Catatan:
- `Administrator` berada di jalur setup dan kontrol data, bukan di jalur persetujuan proposal harian.
- Jalur persetujuan proposal utama dimulai dari `Pengusul` dan berakhir di `Bendahara`.

## Lingkungan Production (sirangkul.man2kotamakassar.sch.id)

Di tahap *production*, tidak ada password default. 
- Password di-hash menggunakan `Bcrypt` (rounds: 12).
- Pembuatan akun baru hanya dapat dilakukan oleh **Administrator** dan **Kepala Madrasah** melalui dashboard, bukan registrasi publik.
- Jika Administrator kehilangan akses, gunakan terminal VPS untuk mereset via `php artisan tinker`.

### Recovery Admin Account (Production ONLY)
```bash
cd /home/sirangkul/apps/sirangkul/api-sirangkul

php artisan tinker

> $u = User::where('role', 'administrator')->first();
> $u->password = Hash::make('NewSecurePassword123!');
> $u->save();
```
