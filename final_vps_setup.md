# Panduan Langkah Terakhir - Deploy Sirangkul ke VPS

Gunakan panduan ini untuk menyelesaikan konfigurasi Nginx dan Backend di VPS Anda. Langkah ini memerlukan hak akses **root** atau **sudo**.

## 1. Konfigurasi Nginx
Salin dan tempel perintah ini ke terminal VPS untuk membuat konfigurasi domain `sirangkul.man2kotamakassar.sch.id`.

```bash
sudo tee /etc/nginx/sites-available/sirangkul <<EOF
server {
    listen 80;
    server_name sirangkul.man2kotamakassar.sch.id;
    root /home/sirangkul/apps/sirangkul/dist;
    index index.html;

    # Frontend (React/Vite)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend (Laravel API)
    location /api {
        alias /home/sirangkul/apps/sirangkul/api-sirangkul/public;
        try_files \$uri \$uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock; # Sesuaikan dengan versi PHP VPS (8.2/8.3)
            fastcgi_param SCRIPT_FILENAME /home/sirangkul/apps/sirangkul/api-sirangkul/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/\$1 last;
    }
}
EOF
```

## 2. Aktifkan Site & Restart Nginx
Jalankan perintah ini untuk mengaktifkan konfigurasi baru dan mematikan konfigurasi default.

```bash
# Aktifkan konfigurasi sirangkul
sudo ln -sf /etc/nginx/sites-available/sirangkul /etc/nginx/sites-enabled/

# Hapus konfigurasi default (jika ada)
sudo rm -f /etc/nginx/sites-enabled/default

# Cek konfigurasi dan restart
sudo nginx -t && sudo systemctl restart nginx
```

## 3. Instalasi Dependensi Backend
Pindah ke direktori API dan jalankan composer.

```bash
cd /home/sirangkul/apps/sirangkul/api-sirangkul
composer install --no-dev --optimize-autoloader
```

## 4. Konfigurasi Izin File (Permissions)
Pastikan Nginx (www-data) dapat menulis ke folder storage Laravel.

```bash
sudo chown -R sirangkul:www-data /home/sirangkul/apps/sirangkul
sudo chmod -R 775 /home/sirangkul/apps/sirangkul/api-sirangkul/storage
sudo chmod -R 775 /home/sirangkul/apps/sirangkul/api-sirangkul/bootstrap/cache
```

---

**Status Saat Ini:**
- [x] Database Migrated (6 users)
- [x] Frontend Build Uploaded
- [x] Backend Files Uploaded
- [ ] Nginx Active (Menunggu langkah di atas)
- [ ] Backend Dependencies (Menunggu langkah di atas)
