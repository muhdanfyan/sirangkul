# Credentials Guide SiRangkul

> **PERINGATAN**: Jangan pernah commit kredensial asli ke public repository. Dokumen ini hanya berisi username dummy/standar untuk keperluan Development dan E2E Testing.

## Lingkungan Local / Testing (VPS & Docker)

Berikut adalah daftar kredensial *seed* yang otomatis dibuat saat menjalankan `php artisan migrate:fresh --seed`. Gunakan kredensial ini untuk pengujian fungsional Role-Based Access Control (RBAC).

| Role (Jabatan) | Email | Password | Kegunaan Utama dalam Testing |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sirangkul.com` | `password` | Membuat RKAM baru, memanajemen pengguna, melihat dashboard global. |
| **Pengusul** (Guru) | `ahmad@madrasah.com` | `password` | Membuat draf proposal anggaran, upload lampiran, pantau status draf. |
| **Verifikator** | `siti@madrasah.com` | `password` | Mereview proposal masuk, accept/reject tahap pertama. |
| **Komite Madrasah**| `komite@madrasah.com` | `password` | Melakukan ACC tahap kedua (tingkat komite). |
| **Kepala Madrasah**| `kepala@madrasah.com` | `password` | Melakukan ACC final mutlak. |
| **Bendahara** | `bendahara@madrasah.com` | `password` | Input nilai aktual kas keluar dan upload bukti transfer dana. |

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
