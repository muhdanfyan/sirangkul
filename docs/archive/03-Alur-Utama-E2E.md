# 03 Alur Utama E2E (End-to-End Walkthrough)

Dokumen ini berisi langkah-langkah *Playbook* bagi Tim Tester UI/QA. Ikuti prosedur ini persis sebelum peluncuran akhir sistem. Disarankan menggunakan fitur "Incognito" browser untuk menghindari *cache-trap*.

## Tahap 1: Setup Foundation (Role: Administrator)
1. Pergi ke `https://sirangkul.man2kotamakassar.sch.id/login`.
2. Login sebagai `admin@sirangkul.com`.
3. Navigasi ke Modul **RKAM**. Set-up 1 Pos Anggaran baru, senilai *Rp 100.000.000*, Kategori *Operasional*, Status *Aktif*.
4. Logout akun Administrator.

## Tahap 2: Simulasi Proposal Real (Role: Pengusul)
1. Login sebagai `ahmad@madrasah.com` (Kategori Pengusul).
2. Pergi ke halaman `Dashboard Pengusul` -> `Buat Pengajuan Baru`.
3. Isi kolom:
   - *RKAM Induk*: Pilih RKAM dari Tahap 1.
   - *Judul*: Simulasi E2E Kegiatan Seminar
   - *Total Anggaran*: Ajukan Rp 15.000.000.
   - *Lampiran*: Upload sembarang file PDF (< 2MB).
4. Klik *Submit*. Pastikan indikator berhasil (toast notification) muncul. Cek status di tabel list menjadi **Submitted**.
5. Logout.

## Tahap 3: Verifikasi Tahap 1 (Role: Verifikator)
1. Login sebagai `siti@madrasah.com`.
2. Pergi ke `Daftar Pengajuan Pending`. Temukan Proposal "*Simulasi E2E Kegiatan Seminar*".
3. Buka Detail. Uji fitur tombol *Download Lampiran PDF*.
4. Klik **Approve**. (Status menjadi **Verified**).
5. Logout.

## Tahap 4: Verifikasi Tahap 2 (Role: Komite Madrasah)
1. Login sebagai `budi@madrasah.com`.
2. Pergi ke `Daftar Proposal Menunggu`.
3. Buka Detail proposal.
4. Klik **Approve** (Status menjadi **Approved**).
5. Logout.

## Tahap 5: Eksekusi Final (Role: Kepala Madrasah)
1. Login sebagai `kepala@madrasah.com`.
2. Buka `Daftar Proposal Menunggu Final ACC`.
3. Klik **Setujui Final ACC**. Tulis catatan di pop-up: *"Silahkan cairkan dana ini segera. - Kepsek"*. (Status menjadi **Final_Approved**).
4. **Validasi Kritis**: Kembali ke halaman `Daftar RKAM` -> Nilai `Sisa Anggaran` otomatis harus telah berkurang Rp 15.000.000.
5. Logout.

## Tahap 6: Kas Keluar (Role: Bendahara)
1. Login sebagai `bendahara@madrasah.com`.
2. Pergi ke `Modul Pencairan` / `Dashboard Bendahara`.
3. Lihat list berstatus Final_Approved.
4. Input menu `Bayar` -> *Metode*: Transfer Bank -> Upload *Kuitansi Bukti* -> nominal riil Rp 15.000.000.
5. Klik Submit. Status berubah menjadi **Funded**.

**Bila ke-6 tahap di atas terlaksana tanpa masalah UI (Blank Screen / Error Red Toast), berarti Testing LULUS (UAT PASSED).**
