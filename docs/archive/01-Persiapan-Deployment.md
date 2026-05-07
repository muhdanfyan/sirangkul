# 01 Persiapan Deployment (Checklist SiRangkul)

Sebelum push kode ke `main` dan menjalankan `.deploy.sh`, lakukan pemeriksaan akhir ini untuk server `sirangkul.man2kotamakassar.sch.id`.

## 1. Environment Backend (`.env`)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL=https://sirangkul.man2kotamakassar.sch.id`
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] `DB_CONNECTION=mysql` dengan kredensial VPC lokal bukan eksternal.
- [ ] Memastikan `SANCTUM_STATEFUL_DOMAINS` kosong atau dikonfigurasi dengan sangat hati-hati mengikuti token pattern agar terhindar `419 error`.

## 2. Optimalisasi Backend
- [ ] `php artisan optimize` (Hati-hati mengeksekusi ini jika closure routing digunakan sembarangan di Laravel 12!)
- [ ] `php artisan view:cache`
- [ ] Periksa kembali Nginx FastCGI dan `pm.max_children = 50` pada PHP 8.3-FPM (`/etc/php/8.3/fpm/pool.d/www.conf`) untuk menghindari *504 Gateway Time-out* jika banyak guru online berbarengan.
- [ ] Pastikan folder `storage/logs` dan `storage/framework/` dapat direwrite (`chmod -R 775`).

## 3. Frontend Build (`dist`)
- [ ] Pastikan `vite.config.ts` dan `.env.production` (atau default API URl di axios) mengarah tepat ke `https://sirangkul.man2kotamakassar.sch.id/api`. Tidak tumpang tindih `api/api/`.
- [ ] Jalankan `npm run build` lokal. Jika banyak *warning* ukuran chunk, setup opsi pemisahan bundle `Rollup` di `vite.config.ts`.
- [ ] Nginx SPA Support: Konfigurasi Nginx di blok blok `location /` wajib berisi `try_files $uri $uri/ /index.html;`

## 4. Keamanan Infrastruktur Tingkat VPS
- Matikan service yang tidak lagi dipakai yang menyedot RAM, cth: `apache2` jika full switch ke Nginx.
- Setup fail2ban (opsional, direkomendasikan).
- Pastikan HSTS (Strict-Transport-Security) di Nginx berada di mode "always".
