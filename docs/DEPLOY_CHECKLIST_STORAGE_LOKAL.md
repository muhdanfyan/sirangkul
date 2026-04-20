# Checklist Deploy Aman Tanpa Cloudflare / Object Storage

Panduan ini khusus untuk arsitektur SiRangkul saat ini:
- Frontend Vite/React dilayani dari `dist`
- Backend Laravel dilayani dari `api-sirangkul/public`
- File upload user masih disimpan di filesystem VPS lokal

Dokumen ini fokus mencegah kasus `404` pada file proposal dan bukti pembayaran setelah deploy.

## 1. Pahami Lokasi File Runtime

File upload user **bukan** disimpan di repo frontend `public/file`.

Lokasi file runtime backend saat ini:
- Lampiran proposal: `api-sirangkul/storage/app/attachments/...`
- Bukti pembayaran: `api-sirangkul/storage/app/public/payment_proofs/...`

Konsekuensinya:
- Jika folder `storage` ikut terhapus saat deploy, database masih punya row attachment/payment, tetapi file fisiknya hilang.
- Saat user klik lihat/unduh, backend akan mengembalikan `404`.

## 2. Prinsip Deploy yang Wajib Diikuti

- Jangan perlakukan `storage/app/attachments` sebagai bagian dari source code.
- Jangan deploy dengan cara yang menghapus `api-sirangkul/storage`.
- Jangan mengandalkan git pull/fresh clone untuk mempertahankan file upload user.
- Jika production multi-server, local storage tidak cukup. Harus ada shared storage atau object storage.

## 3. Minimum Safe Setup di VPS

Pastikan folder berikut tetap persistent:

```bash
/home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/attachments
/home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/public/payment_proofs
```

Kalau saat ini deploy Anda masih replace folder aplikasi secara penuh, pindahkan persistence ke luar folder release:

```bash
/home/sirangkul/data/sirangkul-storage/attachments
/home/sirangkul/data/sirangkul-storage/payment_proofs
```

Lalu symlink kembali ke Laravel storage:

```bash
mkdir -p /home/sirangkul/data/sirangkul-storage/attachments
mkdir -p /home/sirangkul/data/sirangkul-storage/payment_proofs

mkdir -p /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app
mkdir -p /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/public

rm -rf /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/attachments
rm -rf /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/public/payment_proofs

ln -s /home/sirangkul/data/sirangkul-storage/attachments \
  /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/attachments

ln -s /home/sirangkul/data/sirangkul-storage/payment_proofs \
  /home/sirangkul/apps/sirangkul/api-sirangkul/storage/app/public/payment_proofs
```

## 4. Backup Sebelum Deploy

Sebelum deploy backend, backup dulu folder file runtime:

```bash
cd /home/sirangkul/apps/sirangkul/api-sirangkul
mkdir -p /home/sirangkul/backups

tar -czf /home/sirangkul/backups/sirangkul-attachments-$(date +%F-%H%M%S).tar.gz storage/app/attachments
tar -czf /home/sirangkul/backups/sirangkul-payment-proofs-$(date +%F-%H%M%S).tar.gz storage/app/public/payment_proofs
```

Jika deploy Anda aman dan tidak menyentuh folder storage, backup ini hanya jadi mitigasi rollback.

## 5. Checklist Saat Deploy Backend

- [ ] Pastikan deploy script tidak memakai `rm -rf api-sirangkul` tanpa restore storage
- [ ] Pastikan deploy script tidak memakai `rsync --delete` yang menghapus `storage/app/attachments`
- [ ] Pastikan folder `storage` tidak tertimpa dari artefak kosong
- [ ] Jalankan `composer install --no-dev --optimize-autoloader`
- [ ] Jalankan `php artisan migrate --force`
- [ ] Jalankan `php artisan optimize:clear`
- [ ] Jika masih ada akses file publik langsung dari `/storage/...`, jalankan `php artisan storage:link`

## 6. Permission yang Wajib Dicek

```bash
sudo chown -R sirangkul:www-data /home/sirangkul/apps/sirangkul/api-sirangkul
sudo chmod -R 775 /home/sirangkul/apps/sirangkul/api-sirangkul/storage
sudo chmod -R 775 /home/sirangkul/apps/sirangkul/api-sirangkul/bootstrap/cache
```

Kalau memakai folder persistence di luar repo:

```bash
sudo chown -R sirangkul:www-data /home/sirangkul/data/sirangkul-storage
sudo chmod -R 775 /home/sirangkul/data/sirangkul-storage
```

## 7. Verifikasi Pasca Deploy

### 7.1 Cek file attachment dari database

```bash
cd /home/sirangkul/apps/sirangkul/api-sirangkul
php artisan tinker --execute="dump(App\Models\ProposalAttachment::latest()->take(10)->get(['id','proposal_id','file_name','file_path']));"
```

### 7.2 Cek file fisik benar-benar ada

```bash
ls -lah storage/app/attachments
find storage/app/attachments -type f | tail -20
ls -lah storage/app/public/payment_proofs
find storage/app/public/payment_proofs -type f | tail -20
```

### 7.3 Cek satu file spesifik

```bash
test -f storage/app/attachments/<proposal_id>/<nama_file>.gz && echo OK || echo MISSING
test -f storage/app/public/payment_proofs/<nama_file>.gz && echo OK || echo MISSING
```

### 7.4 Cek log jika user masih dapat 404

```bash
grep -n "Proposal attachment file missing on every known disk" storage/logs/laravel.log | tail -20
tail -100 storage/logs/laravel.log
```

## 8. Smoke Test Manual Setelah Deploy

Minimal uji ini di production:
- [ ] Login sebagai pengusul
- [ ] Buat proposal baru
- [ ] Upload 2 file: proposal dan LPJ
- [ ] Submit proposal
- [ ] Login sebagai verifikator dan buka file attachment
- [ ] Login sebagai kepala/komite dan buka file attachment yang sama
- [ ] Proses pembayaran dengan bukti bayar
- [ ] Unduh ulang bukti pembayaran

Kalau salah satu langkah download gagal, cek:
- apakah row DB ada
- apakah file fisik ada
- apakah permission folder benar
- apakah server yang melayani request sama dengan server tempat file disimpan

## 9. Red Flags di Deploy Script

Kalau deploy script Anda mengandung salah satu pola ini, risiko `404` tinggi:

- `rm -rf /home/sirangkul/apps/sirangkul/api-sirangkul`
- clone ulang seluruh folder backend ke path yang sama
- `rsync --delete` tanpa exclude `storage/`
- copy artefak backend yang tidak membawa file runtime lalu menimpa `storage`

## 10. Rekomendasi Praktis Untuk Kondisi Sekarang

Urutan yang paling aman tanpa Cloudflare/R2:

1. Tetap simpan upload user di VPS backend.
2. Jadikan `attachments` dan `payment_proofs` sebagai folder persistent.
3. Backup sebelum deploy.
4. Pastikan deploy script tidak menghapus `storage`.
5. Jalankan smoke test file setelah deploy.

Ini cukup untuk single VPS. Jika nanti aplikasi dipindah ke multi-instance atau autoscaling, local storage harus dihentikan dan diganti shared storage/object storage.
