# Analisis Dampak Perubahan 11 Poin

Dokumen ini memetakan file yang kemungkinan besar terdampak oleh 11 poin perubahan yang diminta, dengan acuan alur kerja di `docs/FE_BE_CHANGE_FLOW.md`.

## Scope

- Frontend aktif: `D:\Projects\SIRANGKULLL\sirangkul`
- Backend terkait: `D:\Projects\SIRANGKULLL\api-sirangkul`

## Catatan Penting Sebelum Implementasi

- Repo FE saat ini punya dua implementasi form proposal:
  - `src/pages/ProposalSubmission.tsx` untuk route `/proposal-submission`
  - `src/components/widgets/ProposalForm.tsx` untuk route legacy `/proposals/new` dan edit `/proposals/:id/edit`
- Poin `2`, `4`, dan `8` berisiko tidak konsisten kalau hanya diubah di salah satu form.
- Upload limit saat ini masih `5 MB` di FE dan BE.
- `Approval notes` sudah punya jejak parsial:
  - FE: `src/pages/ProposalApproval.tsx` sudah punya state `notes`
  - BE: tabel `approval_workflows` sudah punya kolom `notes`
  - Tetapi notes belum tersambung end-to-end.
- `RAKMViewer` masih memakai daftar file statis hardcoded di FE, belum berbasis setting backend.

## Ringkasan File yang Paling Sering Muncul

### Frontend

- `src/services/api.ts`
- `src/pages/ProposalSubmission.tsx`
- `src/components/widgets/ProposalForm.tsx`
- `src/components/widgets/ProposalDetail.tsx`
- `src/pages/MyProposals.tsx`
- `src/pages/ProposalApproval.tsx`
- `src/pages/PaymentManagement.tsx`
- `src/pages/RAKMViewer.tsx`
- `public/user_guide/index.html`
- `public/user_guide/panduan.html`
- `public/user_guide/panduan-pdf.html`

### Backend

- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/app/Http/Controllers/PaymentController.php`
- `../api-sirangkul/app/Http/Controllers/RkamController.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/app/Models/Proposal.php`
- `../api-sirangkul/app/Models/Payment.php`
- `../api-sirangkul/app/Models/ProposalAttachment.php`
- `../api-sirangkul/app/Models/ApprovalWorkflow.php`
- `../api-sirangkul/database/migrations/*proposal*`
- `../api-sirangkul/database/migrations/*payment*`

## Dampak Per Poin

### 1. Perbaiki bug view file proposal `404`

#### Frontend yang terdampak

- `src/components/widgets/ProposalDetail.tsx`
- `src/services/api.ts`

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/app/Models/ProposalAttachment.php`
- `../api-sirangkul/app/Models/User.php`
- `../api-sirangkul/config/filesystems.php` jika akar masalah ternyata ada di disk/path storage

#### Catatan

- Bug ini sangat mungkin ada di kombinasi `download endpoint`, `role check`, atau `path storage`.
- Di `ProposalAttachmentController.php` daftar role viewer belum konsisten dengan helper role di `User.php`.

### 2. Tambah fitur upload ulang file yang ditolak / direvisi di akun pengusul

#### Frontend yang terdampak

- `src/components/widgets/ProposalForm.tsx`
- `src/components/widgets/ProposalDetail.tsx`
- `src/pages/MyProposals.tsx`
- `src/services/api.ts`
- `src/pages/ProposalSubmission.tsx` jika strategi implementasi ingin menyatukan form create/edit

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/app/Models/Proposal.php`
- `../api-sirangkul/app/Models/ProposalAttachment.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/database/migrations/2026_02_10_120000_add_resubmission_tracking_to_proposals.php`
- migration baru jika perlu membedakan attachment lama vs attachment hasil revisi

#### Catatan

- Saat ini proposal rejected bisa di-edit dan di-submit ulang, tetapi form edit belum punya upload attachment seperti form create.

### 3. Kata `Review` diganti menjadi `Persetujuan Komite` pada panduan `index.html`

#### Frontend / dokumentasi yang terdampak

- `public/user_guide/index.html`
- `public/user_guide/panduan.html`
- `public/user_guide/panduan-pdf.html`

#### Kemungkinan tambahan

- `public/user_guide/screenshots/22-komite-review.png`
- `public/user_guide/screenshots/13-verifikator-review.png`

#### Catatan

- Secara literal teks `Review` muncul di beberapa file panduan, bukan hanya satu file.

### 4. Tambah upload file LPJ saat pembuatan proposal

#### Frontend yang terdampak

- `src/pages/ProposalSubmission.tsx`
- `src/components/widgets/ProposalForm.tsx`
- `src/components/widgets/ProposalDetail.tsx`
- `src/pages/ProposalApproval.tsx` jika file LPJ perlu dibedakan saat approval
- `src/pages/MyProposals.tsx` jika pengusul perlu melihat tipe file yang diupload
- `src/services/api.ts`

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/app/Models/Proposal.php`
- `../api-sirangkul/app/Models/ProposalAttachment.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/database/migrations/2026_03_09_163004_add_file_size_and_mime_type_to_proposal_attachments_table.php`
- migration baru yang sangat mungkin dibutuhkan untuk menambah `attachment_type` atau penanda file `proposal` vs `lpj`

#### Catatan

- Struktur attachment saat ini masih generik.
- Jika requirement-nya benar-benar "harus ada 2 file berbeda", backend sebaiknya tidak hanya menghitung jumlah file, tapi juga tipe file yang wajib ada.

### 5. File maksimal upload hanya `1MB`

#### Frontend yang terdampak

- `src/pages/ProposalSubmission.tsx`
- `src/pages/PaymentManagement.tsx`
- `src/components/widgets/ProposalForm.tsx` jika upload juga ditambahkan di form edit

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/app/Http/Controllers/PaymentController.php`
- `../api-sirangkul/tests/Feature/ProposalRejectionTest.php` jika ada skenario file/validasi yang ikut berubah
- `../api-sirangkul/tests/Feature/PaymentRejectionTest.php` jika flow pembayaran ikut berubah

#### Catatan

- Limit FE sekarang `5 MB`.
- Limit BE attachment proposal memakai `file_sizes.* max:5242880`.
- Limit BE pembayaran memakai `max:6144`.

### 6. File Excel di `/rakm-viewer` tidak diperlukan / bisa dihapus

#### Frontend yang terdampak

- `src/pages/RAKMViewer.tsx`
- `public/file/RKAM PERUBAHAN-REVISI TA 2025 - 17092025.xls`

#### Kemungkinan tambahan

- `public/user_guide/index.html`
- `public/user_guide/panduan.html`
- `public/user_guide/panduan-pdf.html`

#### Catatan

- File Excel saat ini masih hardcoded di array `rakmFiles` dalam `RAKMViewer.tsx`.

### 7. Bisa jadi ada pengaturan file yang ingin ditampilkan di halaman Transparansi RKAM `/rakm-viewer`

#### Frontend yang terdampak

- `src/pages/RAKMViewer.tsx`
- `src/services/api.ts`
- `src/pages/RKAMManagement.tsx` jika pengaturannya ditempel di modul RKAM
- `src/components/Layout/Sidebar.tsx` jika nantinya ada menu setting baru

#### Backend yang terdampak

- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/app/Http/Controllers/RkamController.php` jika tetap dipaksakan satu controller
- kemungkinan lebih ideal: controller/model/migration baru khusus dokumen transparansi
- `../api-sirangkul/config/filesystems.php` jika file dokumen transparansi disimpan dan disajikan terpisah

#### Catatan

- Ini poin yang paling berpotensi melebar karena saat ini belum ada entitas backend untuk "dokumen transparansi publik".
- Kalau fiturnya jadi dinamis, file statis di `public/file/*` mungkin tidak lagi cukup.

### 8. Tanggal mulai proposal saat buat proposal tidak bisa pilih tanggal setelah hari ini

#### Frontend yang terdampak

- `src/pages/ProposalSubmission.tsx`
- `src/components/widgets/ProposalForm.tsx`

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Requests/StoreProposalRequest.php`
- `../api-sirangkul/app/Models/Proposal.php`
- `../api-sirangkul/database/migrations/2026_04_16_064210_add_extra_fields_to_proposals_table.php`

#### Catatan

- Di FE form utama sudah ada field tanggal, tetapi form edit/legacy belum sinkron.
- Di backend validasi tanggal saat ini masih longgar, jadi kemungkinan perbaikannya dominan di FE.

### 9. Saat persetujuan proposal, ada catatan juga

#### Frontend yang terdampak

- `src/pages/ProposalApproval.tsx`
- `src/components/widgets/ProposalDetail.tsx`
- `src/pages/MyProposals.tsx`
- `src/pages/ProposalTracking.tsx`
- `src/services/api.ts`

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Controllers/ApprovalWorkflowController.php`
- `../api-sirangkul/app/Models/ApprovalWorkflow.php`
- `../api-sirangkul/app/Models/Proposal.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/database/migrations/2025_10_11_132956_create_approval_workflows_table.php`

#### Catatan

- FE approval modal sudah punya `notes`, tetapi belum dikirim ke endpoint verify/approve/final-approve.
- BE sudah punya tabel `approval_workflows.notes`, tetapi controller approval utama belum memakainya.

### 10. Saat proses pembayaran perlu upload file bukti pembayaran

#### Frontend yang terdampak

- `src/pages/PaymentManagement.tsx`
- `src/services/api.ts`

#### Backend yang terdampak

- `../api-sirangkul/app/Http/Controllers/PaymentController.php`
- `../api-sirangkul/app/Models/Payment.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/database/migrations/2025_11_07_055724_add_payment_proof_file_to_payments_table.php`
- `../api-sirangkul/database/migrations/2025_11_06_100000_add_payment_management_columns_to_payments_table.php`

#### Catatan

- Saat ini upload bukti pembayaran ada di step `complete payment`, bukan di step `process payment`.
- Jadi poin ini bukan sekadar tambah field, tetapi menggeser momen upload di alur pembayaran.

### 11. Tombol penolakan pembayaran di akun bendahara pada menu pembayaran dihilangkan

#### Frontend yang terdampak

- `src/pages/PaymentManagement.tsx`
- `src/components/RejectionModal.tsx`
- `src/services/api.ts`

#### Backend yang mungkin terdampak

- `../api-sirangkul/app/Http/Controllers/PaymentController.php`
- `../api-sirangkul/routes/api.php`
- `../api-sirangkul/tests/Feature/PaymentRejectionTest.php`

#### Catatan

- Kalau perubahan ini hanya UI, backend reject endpoint bisa tetap ada.
- Kalau aturan bisnisnya benar-benar dihapus, endpoint dan test reject payment juga perlu disesuaikan.

## Rekomendasi Urutan Kerja

1. Rapikan dulu scope FE yang dobel pada form proposal:
   - `src/pages/ProposalSubmission.tsx`
   - `src/components/widgets/ProposalForm.tsx`
2. Setelah itu rapikan kontrak API di:
   - `src/services/api.ts`
   - `../api-sirangkul/routes/api.php`
   - controller proposal/payment/attachment terkait
3. Baru sinkronkan dokumentasi dan halaman publik:
   - `src/pages/RAKMViewer.tsx`
   - `public/user_guide/*.html`

## Prioritas Tinggi untuk Dicek Lebih Dulu

- `src/components/widgets/ProposalDetail.tsx`
- `src/components/widgets/ProposalForm.tsx`
- `src/pages/ProposalSubmission.tsx`
- `src/pages/PaymentManagement.tsx`
- `src/pages/RAKMViewer.tsx`
- `src/services/api.ts`
- `../api-sirangkul/app/Http/Controllers/ProposalAttachmentController.php`
- `../api-sirangkul/app/Http/Controllers/ProposalController.php`
- `../api-sirangkul/app/Http/Controllers/PaymentController.php`
- `../api-sirangkul/routes/api.php`
