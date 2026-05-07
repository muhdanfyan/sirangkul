# Ringkasan Sistem SiRangkul

Dokumen ini memberikan gambaran umum seluruh sistem SiRangkul (Sistem Informasi Anggaran dan Keuangan Madrasah), arsitektur, dan teknologi utama yang digunakan.

## 1. Arsitektur

Sistem menggunakan arsitektur Monorepo/Decoupled dengan:
- **Frontend Panel**: React TypeScript, Vite, Tailwind CSS.
- **Backend API**: framework PHP Laravel 12.3.
- **Database Utama**: MySQL/MariaDB.
- **Infrastruktur**: Ubuntu VPS, Nginx, Let's Encrypt SSL.

## 2. Platform Utama

Sistem SiRangkul memisahkan logika ke dalam komponen-komponen terisolasi untuk tujuan keamanan dan beban pengguna.

### 2.1. Panel Manajemen (Frontend)
- **Tujuan**: Sebagai dashboard utama bagi user (Administrator, Pengusul, Verifikator, Kepala Madrasah, Bendahara, Komite).
- **Pengguna Utama**: Staf internal sekolah dan pengusul proposal.
- **Hosting Target**: `sirangkul.man2kotamakassar.sch.id`.
- **Akses Token**: Interaksi stateless menggunakan Sanctum Bearer token.

### 2.2. Layanan API Inti (Backend)
- **Tujuan**: Bertindak sebagai *single source of truth*; mengatur peran pengguna, menyimpan data proposal, rkam, pengeluaran, pembayaran, logs, pemberitahuan, dan autentikasi.
- **Hosting Target**: `sirangkul.man2kotamakassar.sch.id/api`.
- **Pengguna Utama**: Tidak ada secara langsung, hanya dikonsumsi oleh Panel Manajemen.

## 3. Alur Data Bisnis (Sirkulasi Proposal & Keuangan)
1. **Perencanaan**: RKAM (Rencana Kerja dan Anggaran Madrasah) diinput oleh Administrator.
2. **Pengajuan**: Pengusul membuat dan mengirimkan draf proposal anggaran, memilih RKAM yang relevan.
3. **Verifikasi**: Verifikator memeriksa proposal dan lampirannya. Jika valid, diteruskan; jika ada kekurangan, dikembalikan.
4. **Persetujuan (Approval)**:
    - Persetujuan Awal oleh Komite Madrasah.
    - Persetujuan Akhir oleh Kepala Madrasah.
5. **Eksekusi Kas**: Bendahara mengatur pencairan dana serta melampirkan bukti pencairan dan kwitansi. 
6. **Laporan & Visibilitas**: Seluruh progress dan pengeluaran bisa dilacak melalui dashboard.

## 4. Sistem Keamanan
- **Autentikasi**: Laravel Sanctum via Bearer Tokens.
- **Kontrol Hak Akses (RBAC)**: Enam level otorisasi (`administrator`, `pengusul`, `verifikator`, `kepala_madrasah`, `bendahara`, `komite_madrasah`).
- **Transport Security**: Wajib HTTPS (HSTS aktif). Tidak ada endpoint yang berjalan pada HTTP mentah di *production*.
