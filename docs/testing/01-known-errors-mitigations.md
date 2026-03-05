# 01 Known Errors & Mitigations Registry

Log penanganan masalah (*incident reports*) spesifik di lingkungan pengujian maupun deployment Sirangkul.

## ID: SSRK-01 (Session / CSRF Middleware Deadlock)
- **Tingkat Kritikal**: 🔴 BLOCKER
- **Lingkungan**: Production (Nginx)
- **Problem**: Login via *Curl* berhasil, namun login via Browser (SPA Axios) sering mengalami error *419 Page Expired* Laravel Sanctum, padahal kredensial 100% benar.
- **Analisis Root Cause**: SPA di frontend murni bekerja sebagai API Client (Bearer Token), namun sisi Backend Laravel memaksakan diri memvalidasi CSRF Stateful Cookie bila menemukan `SANCTUM_STATEFUL_DOMAINS` sama. Ini menyebabkan kegagalan (mismatch handshake).
- **Resolusi Final yang Diamanani**: 
   - Di `bootstrap/app.php`, **HAPUS/KOMENTARI** baris `->withMiddleware(function ($middleware) { $middleware->statefulApi(); })`.
   - Hal ini merubah backend pure 100% bergantung pada `auth:sanctum` Token valid di Header HTTP.
- **Pencegahan**: Skrip `test_api_crud.sh` telah dimodifikasi untuk *tidak* memparsing Cookie, sejalan dengan metodologi UI React.

## ID: SSRK-02 (FastCGI Timeout di 504 Nginx)
- **Tingkat Kritikal**: 🟠 MAJOR
- **Lingkungan**: VPS Production
- **Problem**: Endpoint lamban merespons atau *Connection Timed out* saat request API.
- **Analisis Root Cause**: Konfigurasi FPM default di Ubuntu 24 (`/etc/php/8.3/fpm/pool.d/www.conf`) terlalu kecil sehingga di *peak-hour* server "chokes" karena proses pekerja habis.
- **Resolusi Final yang Diamanani**: Di-scale secara agresif ke `pm.max_children = 50` via skrip `vps_final_setup.sh`.
- **Pencegahan**: Jangan gunakan script Bash sembarangan yang me-reset ulang configurasi PHP-FPM di masa depan tanpa injeksi sed nilai maksimal.

## ID: SSRK-03 (URI Prefix Duplication Bug)
- **Tingkat Kritikal**: 🟡 MINOR (tetapi Fatal jika diabaikan)
- **Lingkungan**: VPS Nginx Setup
- **Problem**: API URL terpaksa dipanggil sebagai `/api/api/health` daripada `/api/health`.
- **Analisis Root Cause**: Nginx sudah memetakan `/api` ke index.php, dan Laravel 12 secara *built-in defaults* `bootstrap/app.php` menambahkan prefix ruting `/api` pada file `routes/api.php`-nya.
- **Resolusi Final yang Diamanani**: Tambahkan argumen `apiPrefix: ''` (string kosong) pada `->withRouting(...)` di app bootstrap.
