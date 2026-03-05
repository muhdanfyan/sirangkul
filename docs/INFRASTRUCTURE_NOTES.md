# Infrastructure Notes SiRangkul

Dokumen ini mencatat topologi infrastruktur server VPS yang dihuni oleh aplikasi SiRangkul.

## Profil Server (Node Utama)
- **Hostname**: `sirangkul.man2kotamakassar.sch.id`
- **OS**: Ubuntu 24.04 (Noble Numbat)
- **Web Server**: Nginx (1.24+)
- **PHP**: FPM 8.3 (Packages: `cli`, `fpm`, `mysql`, `xml`, `mbstring`, `curl`, `zip`)
- **Database Engine**: MySQL 8+ / MariaDB 10+
- **SSL**: Let's Encrypt (Certbot)
- **Node.js**: v20+ (Untuk build frontend lokal VPS jika dibutuhkan, walaupun disarankan build di CI/CD)

## Arsitektur Alamat/Routing Nginx
Aplikasi berjalan dalam 1 domain utama namun dipecah path-nya (Subpath strategy).

1. `Location /` (Frontend SPA)
   - Disajikan dari `/home/sirangkul/apps/sirangkul/dist`
   - Routing: `try_files $uri $uri/ /index.html;` (Wajib untuk React Router DOM).

2. `Location /api` (Backend API)
   - Disajikan dari symlink `/home/sirangkul/apps/sirangkul/api-sirangkul/public` yang di-alias sebagai `api-sirangkul/api`.
   - Menghubungkan Nginx ke FastCGI PHP 8.3 FPM Sock (`/var/run/php/php8.3-fpm.sock`).
   - Prefix routing di dalam Laravel telah dihapus dari `bootstrap/app.php` sehingga URL tidak dobel `/api/api/`.

## Konfigurasi Kinerja (PHP-FPM)
Dikarenakan aplikasi ini merupakan sistem internal sekolah (traffic burst pada jam kerja/rapat anggaran), setting FPM Pool `www.conf` (`/etc/php/8.3/fpm/pool.d/www.conf`) telah dinaikkan:
- `pm = dynamic`
- `pm.max_children = 50`
- `pm.start_servers = 10`
- `pm.min_spare_servers = 5`
- `pm.max_spare_servers = 20`
*Jika Nginx error 502/504, cek `tail -f /var/log/php8.3-fpm.log`.*

## Pola Deployment
Terdapat skrip automasi seperti `vps_final_setup.sh` atau Ansible scripts yang mengelola *pulling* dari repository, `composer install`, `php artisan migrate`, dan `npm run build`. Eksekusi dijalankan via user `sirangkul` (non-root) namun memiliki izin `sudo` terbatas tanpa tty `Sfgxjs4H38DQb7K` untuk mereboot service Nginx/FPM.
