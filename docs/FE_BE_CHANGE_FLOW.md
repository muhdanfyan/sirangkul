# Akses Backend dan Alur Perubahan Fitur

Dokumen ini jadi acuan kerja tim supaya setiap perubahan fitur dilakukan dengan urutan yang konsisten.

## Path Project

- Frontend (repo aktif): `D:\Projects\SIRANGKULLL\sirangkul`
- Backend Laravel: `D:\Projects\SIRANGKULLL\api-sirangkul`

## Aturan Utama

- Jika ada perubahan fitur, sesuaikan dulu di frontend (FE), baru lanjut penyesuaian di backend (BE).

## SOP Singkat (FE -> BE)

1. Definisikan perubahan fitur dari sisi UI/UX dan alur halaman FE.
2. Cek dampak ke kontrak API (endpoint, payload, response, validasi).
3. Implementasi dan rapikan perubahan FE terlebih dahulu.
4. Catat gap API yang belum didukung BE.
5. Implementasi perubahan BE di `D:\Projects\SIRANGKULLL\api-sirangkul`.
6. Lakukan uji integrasi ulang FE + BE sampai alur fitur stabil.

## Checklist Sebelum Selesai

- FE sudah sesuai kebutuhan fitur terbaru.
- Daftar perubahan kontrak API sudah jelas.
- BE sudah menyesuaikan kontrak final dari FE.
- Testing end-to-end untuk alur fitur sudah lolos.
