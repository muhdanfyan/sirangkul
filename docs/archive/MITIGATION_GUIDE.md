# Mitigation Guide: SiRangkul

Panduan ini berisi cara merespon dan memperbaiki error/masalah fatal jika terjadi di sistem *Production*.

## 1. Error 419 Page Expired (Pada Endpoint Login / POST)
- **Gejala**: Pengguna tidak dapat login. Akses API lewat frontend selalu direject oleh Laravel. Console log mengindikasikan 419.
- **Penyebab Utama**: Laravel mencoba memvalidasi CSRF token (Session Guard Mode) tetapi React frontend sedang didesain sebagai API Token Bearer murni secara *stateless*.
- **Mitigasi Cepat (Level Backend)**: 
  1. Pastikan `.env` Laravel untuk `SANCTUM_STATEFUL_DOMAINS` dalam keadaan kosong! Jangan isi domain production di situ.
  2. Buka `bootstrap/app.php` dan hapus baris `$middleware->statefulApi();`.
  3. Clear cache server dengan `php artisan config:clear`.
  4. Jalankan `test_api_crud.sh` tanpa cookie untuk menjamin token turun.

## 2. Error 504 Gateway Time-out
- **Gejala**: Halaman loading lama melebihi 30-60 detik dan Nginx memutus koneksi.
- **Penyebab Utama**: Proses PHP-FPM *starvation* (tercekik) alias *pm.max_children reached limit*. Saat user (guru-guru) mengakses aplikasi berbarengan di satu jam yang sama.
- **Mitigasi**:
  1. Login SSH. Cek `tail -n 20 /var/log/php8.3-fpm.log`. Jika ada "WARNING: server reached pm.max_children setting".
  2. Edit `/etc/php/8.3/fpm/pool.d/www.conf`, naikkan `pm.max_children` dari 50 ke 100 (sesuaikan kapasitas RAM VPS).
  3. `systemctl restart php8.3-fpm`.

## 3. Upload File Lampiran Proposal Gagal (413 Payload Too Large)
- **Gejala**: Verifikator menolak proposal karena file pendukung tidak bisa terbaca. Request file gagal.
- **Mitigasi**:
  1. Edit `/etc/nginx/nginx.conf` pada blok `http {}` -> Tambahkan `client_max_body_size 50M;`.
  2. Edit `php.ini` pada `/etc/php/8.3/fpm/php.ini` -> Ubah `upload_max_filesize` dan `post_max_size` ke `50M`.
  3. Refresh `sudo systemctl restart nginx php8.3-fpm`.

## 4. API 404 (Route Not Found) / Rewrite Nginx Salah
- **Gejala**: Endpoint `https://sirangkul.../api/login` mengembalikan *HTML 404 Nginx Error Page* alih-alih JSON.
- **Mitigasi**: Pastikan `/etc/nginx/sites-available/sirangkul` mengandung blok `location /api` dan meneruskannya (try_files) secara presisi ke `index.php?$query_string`. Hindari menggunakan *alias* yang rumit jika struktur *symlink* `api-sirangkul/api -> public` sudah berjalan aman.
