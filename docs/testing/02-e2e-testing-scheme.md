# 02 Skema Pengujian End-to-End (E2E) SiRangkul

Dokumen ini menjelaskan alur pengujian lengkap dari hulu ke hilir untuk aplikasi SiRangkul.

## 1. Tujuan Pengujian
Memastikan alur proposal anggaran, mulai dari pembuatan draf hingga pencairan dana, berjalan sesuai dengan *business rules* dan hierarki persetujuan (*approval workflow*).

## 2. Aktor yang Terlibat (RBAC Matrix)
Pengujian E2E harus mensimulasikan login dan aksi dari kelima peran fungsional utama:
1.  **`administrator`**: Manajemen pengguna dan RKAM master.
2.  **`pengusul`**: Membuat, merevisi, dan mengirim proposal.
3.  **`verifikator`**: Memeriksa kelengkapan awal dan menyetujui/menolak.
4.  **`komite_madrasah`**: Menyetujui/menolak di tingkat komite.
5.  **`kepala_madrasah`**: Memberikan persetujuan final (ACC).
6.  **`bendahara`**: Melakukan pencairan dana dan upload bukti bayar.

## 3. Alur Pengujian Utama (The Happy Path)
### Fase 1: Persiapan Lingkungan (Admin)
- Admin login.
- Admin membuat/memastikan ketersediaan *user* penguji (dummy) untuk setiap *Role*.
- Admin membuat data **RKAM** (Rencana Kegiatan dan Anggaran Madrasah) dengan `pagu_anggaran` yang mencukupi untuk simulasi.

### Fase 2: Pengajuan (Pengusul)
- Pengusul login.
- Membuat proposal baru (`status`: `Draft`).
- Memilih `rkam_id` yang valid.
- Mengunggah dokumen lampiran (PDF/Word).
- Submit proposal (`status` berubah menjadi `Submitted`).

### Fase 3: Verifikasi Tahap 1 (Verifikator)
- Verifikator login.
- Melihat daftar proposal *Submitted*.
- Menyetujui proposal (`status` berubah menjadi `Verified`). Action log tercatat.

### Fase 4: Persetujuan Komite
- Komite Madrasah login.
- Melihat daftar proposal *Verified*.
- Menyetujui proposal (`status` berubah menjadi `Approved`). Action log tercatat.

### Fase 5: Persetujuan Akhir (Kepala Madrasah)
- Kepala Madrasah login.
- Melihat daftar proposal *Approved*.
- Memeriksa detail dan menyetujui mutlak (`status` berubah menjadi `Final_Approved`). Action log tercatat.
- Memastikan `realisasi` pada RKAM terkait bertambah dan `sisa_anggaran` berkurang secara sinkron.

### Fase 6: Pencairan Dana (Bendahara)
- Bendahara login.
- Melihat daftar proposal *Final_Approved*.
- Melakukan eksekusi pembayaran (Input nominal riil dan metode bayar).
- Mengunggah foto bukti transfer/kuitansi.
- Menyelesaikan pembayaran (`status` proposal berubah menjadi `Funded` atau `Completed`).

## 4. Edge Cases (Skenario Kegagalan yang Harus Diuji)
- **Over Budget**: Pengusul mengajukan jumlah dana yang lebih besar dari `sisa_anggaran` RKAM. (Harus ditolak oleh sistem/422).
- **Penolakan (Rejection Flow)**: Verifikator/Kepala menolak proposal. Status kembali ke Draf/Revisi, dan pengusul wajib bisa mengeditnya ulang.
- **Akses Ilegal**: Pengusul *A* tidak boleh mengedit atau menghapus draf proposal milik Pengusul *B*.
- **CORS Failure**: Login gagal memberikan Bearer token dengan 419 di lingkungan production.
