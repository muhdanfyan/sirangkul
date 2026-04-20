# TODO Implementasi Perubahan 11 Poin

Status legend:
- `PENDING`
- `IN PROGRESS`
- `DONE`
- `BLOCKED`

## Progress Umum

- Total item: `11`
- Selesai: `11`
- Sedang dikerjakan: `0`
- Pending: `0`

## Daftar Pekerjaan

| No | Status | Pekerjaan | Catatan |
| --- | --- | --- | --- |
| 1 | DONE | Perbaiki bug view file proposal 404 | Backend attachment controller disinkronkan untuk role akses dan fallback lokasi file lama/baru; FE error handling diperjelas |
| 2 | DONE | Tambah fitur upload ulang file yang ditolak / direvisi di akun pengusul | Edit proposal sekarang mendukung ganti lampiran proposal/LPJ saat status draft atau rejected |
| 3 | DONE | Ganti kata "Review" menjadi "Persetujuan Komite" pada panduan | Panduan flow diperbarui pada `public/user_guide/index.html` dan file PDF guide terkait |
| 4 | DONE | Tambah upload file LPJ saat pembuatan proposal | Form proposal sekarang mewajibkan 2 file: proposal dan LPJ |
| 5 | DONE | Batasi ukuran upload file maksimal 1MB | Limit 1MB sudah diterapkan untuk lampiran proposal dan bukti pembayaran di FE dan BE |
| 6 | DONE | Hapus / nonaktifkan file Excel di `/rakm-viewer` | File Excel publik dihapus dari daftar viewer dan aset `public/file` |
| 7 | DONE | Siapkan pengaturan file yang tampil di Transparansi RKAM `/rakm-viewer` | Viewer sekarang membaca daftar dokumen dari `public/rkam-viewer-documents.json` |
| 8 | DONE | Batasi tanggal mulai proposal agar tidak bisa memilih tanggal setelah hari ini | Validasi FE dan BE ditambahkan untuk start date |
| 9 | DONE | Tambahkan catatan saat persetujuan proposal | FE approval sekarang mengirim catatan, backend menyimpan ke approval workflow, dan detail proposal menampilkan riwayat catatan |
| 10 | DONE | Wajib upload file bukti pembayaran saat proses pembayaran | Upload bukti pembayaran dipindahkan ke tahap proses pembayaran dan disimpan sejak payment dibuat |
| 11 | DONE | Hilangkan tombol penolakan pembayaran di menu pembayaran bendahara | Tombol tolak pembayaran pada daftar riwayat pembayaran dihapus dari FE |

## Log Implementasi

- 2026-04-17: File tracking dibuat. Poin 1 mulai dikerjakan.
- 2026-04-17: Poin 1 selesai. Perbaikan dilakukan pada endpoint attachment backend dan error handling attachment di frontend.
- 2026-04-17: Poin 2 mulai dikerjakan.
- 2026-04-17: Poin 2 selesai. Upload ulang lampiran saat draft/rejected didukung di FE dan BE.
- 2026-04-17: Poin 4 selesai. Form proposal sekarang mewajibkan file proposal dan file LPJ.
- 2026-04-17: Poin 8 selesai. Tanggal mulai proposal tidak bisa melebihi hari ini di FE dan BE.
- 2026-04-17: Poin 5 selesai. Limit 1MB sekarang konsisten di lampiran proposal dan bukti pembayaran.
- 2026-04-17: Poin 9 selesai. Catatan persetujuan proposal tersimpan ke approval workflow dan tampil di halaman detail/persetujuan.
- 2026-04-17: Poin 10 selesai. Bukti pembayaran wajib diupload saat proses pembayaran.
- 2026-04-17: Poin 11 selesai. Tombol penolakan pembayaran di menu pembayaran dihapus.
- 2026-04-17: Poin 6 selesai. File Excel publik untuk RKAM Viewer dihapus dari aset dan tidak lagi ditampilkan.
- 2026-04-17: Poin 7 selesai. Daftar dokumen transparansi RKAM dipindahkan ke file konfigurasi publik `public/rkam-viewer-documents.json`.
- 2026-04-17: Poin 3 selesai. Istilah `Review` pada alur panduan diganti menjadi `Persetujuan Komite`.
- 2026-04-18: Migrasi backend dijalankan pada database lokal `sirangkul`. Skema `proposal_attachments`, `proposals`, `rkam`, dan `categories` sudah terverifikasi.
- 2026-04-18: Drift schema lokal RKAM diperbaiki dengan menyelaraskan model `Rkam` dan migration pending ke tabel `rkam`.
- 2026-04-18: Drift backend tambahan ditemukan saat smoke test dan diperbaiki: validasi `ProposalController` diselaraskan ke tabel `rkam`, subquery `RkamController`/`ReportingController` tidak lagi memakai alias `rkams`, dan `attachment_type` ditambahkan ke `fillable` model `ProposalAttachment`.
- 2026-04-18: Skrip smoke test alur utama ditambahkan di `scratch/smoke-test-main-flow.mjs`.
- 2026-04-18: Smoke test E2E lokal lulus untuk alur buat proposal, upload 2 lampiran, download lampiran, approval dengan catatan, upload bukti pembayaran, finalisasi pembayaran, dan validasi penolakan `start_date` masa depan.
- 2026-04-18: Checklist deploy aman tanpa object storage ditambahkan di `docs/DEPLOY_CHECKLIST_STORAGE_LOKAL.md` untuk mencegah `404` file upload setelah deploy production.
