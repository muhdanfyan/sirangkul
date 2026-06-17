# 05 Skenario Local Flow Bidang, Approval, Reject, Upload, dan Download Dokumen

Dokumen ini adalah skenario uji lokal untuk memastikan alur proposal per bidang berjalan benar dari pengusul sampai bendahara, termasuk upload dokumen proposal + LPJ, approval, rejection, resubmit, akses lintas bidang, dan download dokumen di setiap titik proposal singgah.

## 1. Tujuan

1. Memastikan setiap bidang punya pasangan user `pengusul` dan `verifikator`.
2. Memastikan Kepala Madrasah dan Ketua Komite bersifat global, tunggal, dan tidak terikat bidang.
3. Memastikan proposal hanya masuk ke antrian role yang benar: Verifikator per bidang, Kepala Madrasah global, Ketua Komite global, lalu Bendahara global.
4. Memastikan reject dari Verifikator, Ketua Komite, dan Kepala Madrasah mengembalikan proposal ke pengusul dengan alasan dan saran perbaikan.
5. Memastikan pengusul dapat mengganti dokumen setelah proposal ditolak.
6. Memastikan file `proposal` dan `lpj` dapat di-download oleh role yang sedang memproses proposal.
7. Memastikan role bidang lain tidak dapat melihat atau download dokumen proposal yang bukan bidangnya.
8. Memastikan setelah final approval, bendahara dapat memproses pembayaran, upload bukti bayar, menyelesaikan pembayaran, dan download bukti pembayaran.

## 2. Lingkungan Uji

Gunakan lokal saja. Jangan jalankan skenario ini langsung pada database produksi.

Frontend lokal:

```powershell
npm.cmd run dev
```

Backend lokal:

```powershell
cd api-sirangkul
php artisan serve --host=127.0.0.1 --port=8000
```

Catatan route lokal:

- Frontend memanggil `/api/...`.
- Vite proxy meneruskan ke Laravel lokal `http://127.0.0.1:8000`.
- Backend lokal saat dokumen ini diperbarui mendaftarkan route API dengan prefix `/api`, jadi Vite proxy meneruskan `/api/...` tanpa rewrite.

## 3. Safety Gate Sebelum Seeder

Seeder boleh dijalankan hanya di database lokal/testing. Sebelum menjalankan seeder, catat jumlah data:

```powershell
cd api-sirangkul
php artisan tinker --execute="echo 'Users: ' . App\Models\User::count() . PHP_EOL; echo 'RKAM: ' . App\Models\Rkam::count() . PHP_EOL; echo 'Proposals: ' . App\Models\Proposal::count() . PHP_EOL;"
```

Jika database lokal berisi data penting, buat dump terlebih dahulu.

Jangan gunakan `migrate:fresh` kecuali database benar-benar khusus testing.

## 4. Seed Data Yang Dibutuhkan

Untuk runner otomatis dari repo frontend, gunakan script setup berikut dari root frontend `sirangkul`:

```powershell
npm run flow:setup
```

Script ini membuat/menyegarkan user flow test, RKAM `Flow Test RKAM ...`, token runtime di `scratch/local-flow-runtime.json`, dan akun Ketua Komite global `flowtest.ketua-komite@sirangkul.test`.

Jika hanya ingin seed backend tanpa token runtime runner, seeder backend tetap tersedia:

```powershell
cd ..\api-sirangkul
php artisan migrate
php artisan db:seed --class=LocalWorkflowSeeder
```

Password semua akun flow test:

```text
Password123!
```

Seeder harus memastikan data berikut tersedia.

| Bidang | Slug | RKAM Lokal |
| :--- | :--- | :--- |
| Pendidikan | `pendidikan` | `Flow Test RKAM Pendidikan` |
| HUMAS | `humas` | `Flow Test RKAM HUMAS` |
| Sarana dan Prasarana | `sarpras` | `Flow Test RKAM Sarana dan Prasarana` |
| Sekretariat Komite | `sekretariat` | `Flow Test RKAM Sekretariat Komite` |

| Role | Pola Email |
| :--- | :--- |
| Pengusul | `flowtest.pengusul.{slug}@sirangkul.test` |
| Verifikator | `flowtest.verifikator.{slug}@sirangkul.test` |
| Kepala Madrasah global | `kepala@madrasah.com` |
| Ketua Komite global | `flowtest.ketua-komite@sirangkul.test` |
| Bendahara global | `flowtest.bendahara@sirangkul.test` |
| Administrator global | `flowtest.admin@sirangkul.test` |

Validasi setelah seeder:

```powershell
php artisan tinker --execute="$roles=['pengusul','verifikator']; foreach (App\Models\Bidang::whereIn('name',['Pendidikan','HUMAS','Sarana dan Prasarana','Sekretariat Komite'])->get() as $b) { echo $b->name . ': '; foreach ($roles as $r) { echo $r . '=' . App\Models\User::where('role',$r)->where('bidang_id',$b->id)->count() . ' '; } echo PHP_EOL; } echo 'Kepala=' . App\Models\User::where('role','kepala_madrasah')->whereNull('bidang_id')->count() . PHP_EOL; echo 'KetuaKomite=' . App\Models\User::where('role','ketua_komite')->whereNull('bidang_id')->count() . PHP_EOL;"
```

Expected:

- Setiap bidang punya minimal 1 pengusul dan 1 verifikator.
- Kepala Madrasah hanya 1 dan `bidang_id` null.
- Ketua Komite hanya 1 dan `bidang_id` null.
- RKAM `Flow Test RKAM ...` tersedia untuk setiap bidang dengan sisa anggaran cukup.

Jalankan runner otomatis dari root frontend setelah setup:

```powershell
npm run flow:test
```

Bersihkan data test setelah selesai:

```powershell
npm run flow:cleanup
```

Cleanup hanya menargetkan marker test: proposal `FLOW-*` atau `HTTP Flow Proposal *`, RKAM `Flow Test RKAM *`, token flow, dan user `flowtest.*@sirangkul.test`. Akun `kepala@madrasah.com` tidak dihapus; hanya token flow-nya yang dibersihkan.

## 5. Dokumen Uji

Siapkan file dummy kecil, masing-masing di bawah 1 MB:

| Jenis | Nama File | MIME |
| :--- | :--- | :--- |
| Proposal | `proposal-{slug}-{case}.pdf` | `application/pdf` |
| LPJ | `lpj-{slug}-{case}.pdf` | `application/pdf` |
| Bukti Pembayaran | `bukti-bayar-{slug}.pdf` | `application/pdf` |

Aturan upload yang harus diuji:

- Wajib upload 2 file: `proposal` dan `lpj`.
- Format valid: PDF, DOC, DOCX, XLS, XLSX.
- Ukuran maksimal UI: 1 MB per file.
- Backend menerima metadata `attachment_types[]` dengan nilai `proposal` dan `lpj`.
- Upload hanya boleh saat proposal `draft` atau `rejected`.
- Upload ulang tipe yang sama harus mengganti file lama.

## 6. Matriks Proposal Per Bidang

Untuk setiap bidang, buat 4 proposal agar approve dan reject diuji merata.

| Case | Nama Proposal | Jalur |
| :--- | :--- | :--- |
| A | `FLOW-{slug}-APPROVE` | Full approve sampai completed |
| B | `FLOW-{slug}-REJECT-VERIFIKATOR` | Reject di Verifikator, revisi, resubmit, lanjut approve |
| C | `FLOW-{slug}-REJECT-KETUA-KOMITE` | Reject di Ketua Komite, revisi, resubmit, lanjut approve |
| D | `FLOW-{slug}-REJECT-KEPALA` | Reject di Kepala Madrasah, revisi, resubmit, lanjut approve |

Total minimal proposal: 4 bidang x 4 case = 16 proposal.

Gunakan jumlah pengajuan berbeda agar mudah dilacak:

| Case | Jumlah Pengajuan |
| :--- | ---: |
| A | 1.000.000 |
| B | 1.250.000 |
| C | 1.500.000 |
| D | 1.750.000 |

## 7. Alur Umum Pembuatan Proposal

Ulangi langkah ini untuk setiap proposal pada matriks.

1. Login sebagai pengusul bidang terkait.
2. Buka `Buat Proposal`.
3. Pilih RKAM `Flow Test RKAM {Bidang}`.
4. Isi judul sesuai case.
5. Isi deskripsi dengan nama bidang dan case.
6. Isi tanggal mulai hari ini atau tanggal lampau yang valid.
7. Isi tanggal selesai sama atau setelah tanggal mulai.
8. Isi jumlah pengajuan sesuai tabel.
9. Upload `proposal-{slug}-{case}.pdf`.
10. Upload `lpj-{slug}-{case}.pdf`.
11. Simpan proposal.
12. Buka detail proposal.
13. Pastikan status awal `draft`.
14. Pastikan dua dokumen muncul: `File Proposal` dan `File LPJ`.
15. Download kedua dokumen sebagai pengusul.
16. Submit proposal.
17. Pastikan status menjadi `submitted`.

Expected:

- Proposal tersimpan tanpa error.
- Dokumen tersimpan tanpa error.
- Download dokumen sebagai pengusul berhasil.
- Setelah submit, proposal masuk antrian Verifikator bidang yang sama.

## 8. Case A: Full Approve Sampai Completed

Jalankan untuk semua bidang.

1. Login Verifikator bidang yang sama.
2. Buka antrian persetujuan.
3. Pastikan proposal `FLOW-{slug}-APPROVE` terlihat.
4. Buka detail.
5. Download `File Proposal` dan `File LPJ`.
6. Approve dengan catatan `Verifikasi dokumen lengkap untuk {Bidang}`.
7. Pastikan status menjadi `verified`.
8. Login Kepala Madrasah.
9. Pastikan proposal semua bidang terlihat, termasuk proposal ini.
10. Download `File Proposal` dan `File LPJ`.
11. Approve dengan catatan `Disetujui Kepala Madrasah`.
12. Pastikan status menjadi `approved`.
13. Login Ketua Komite global.
14. Pastikan proposal semua bidang yang sudah disetujui Kepala Madrasah terlihat, termasuk proposal ini.
15. Download `File Proposal` dan `File LPJ`.
16. Approve final dengan catatan `Ketua Komite menyetujui proposal {Bidang}`.
17. Pastikan status menjadi `final_approved`.
18. Login Bendahara.
19. Buka daftar pembayaran pending.
20. Pastikan proposal muncul.
21. Proses pembayaran dengan data rekening dummy.
22. Upload `bukti-bayar-{slug}.pdf`.
23. Pastikan status proposal menjadi `payment_processing`.
24. Download bukti pembayaran dari tampilan payment.
25. Complete payment.
26. Pastikan status proposal menjadi `completed`.
27. Buka detail proposal sebagai pengusul dan bendahara, pastikan ringkasan pembayaran tampil.

Expected:

- Semua approval menghasilkan status berurutan: `submitted -> verified -> approved -> final_approved -> payment_processing -> completed`, dengan makna `verified` menunggu Kepala Madrasah dan `approved` menunggu Ketua Komite.
- Download dua dokumen berhasil di Verifikator, Ketua Komite, Kepala Madrasah, Bendahara, dan Pengusul.
- Download bukti pembayaran berhasil.
- Tidak ada 403 untuk role yang berhak.
- Tidak ada 404 file missing.

## 9. Case B: Reject Di Verifikator Lalu Resubmit

Jalankan untuk semua bidang.

1. Login Verifikator bidang yang sama.
2. Buka proposal `FLOW-{slug}-REJECT-VERIFIKATOR`.
3. Download `File Proposal` dan `File LPJ`.
4. Reject dengan:
   - Alasan: `Dokumen proposal belum memuat rincian kebutuhan bidang {Bidang}.`
   - Saran: `Lengkapi rincian kebutuhan, jadwal kegiatan, dan penanggung jawab sebelum diajukan ulang.`
5. Pastikan status menjadi `rejected`.
6. Login Pengusul bidang yang sama.
7. Buka detail proposal.
8. Pastikan alasan dan saran perbaikan terlihat.
9. Edit proposal.
10. Upload ulang dua dokumen pengganti:
    - `proposal-{slug}-reject-verifikator-revisi.pdf`
    - `lpj-{slug}-reject-verifikator-revisi.pdf`
11. Simpan.
12. Download dua dokumen revisi sebagai pengusul.
13. Submit ulang.
14. Login Verifikator bidang yang sama.
15. Pastikan dokumen yang tampil adalah dokumen revisi, bukan dokumen lama.
16. Approve.
17. Lanjutkan ke Kepala Madrasah, Ketua Komite, dan Bendahara seperti Case A.

Expected:

- Reject Verifikator hanya valid saat status `submitted`.
- Status berubah ke `rejected`.
- Field `rejected_by_role` bernilai `verifikator`.
- Pengusul dapat edit saat `rejected`.
- Upload ulang mengganti file lama.
- Setelah resubmit, status kembali ke `submitted` dan catatan approval lama yang tidak relevan bersih.

## 10. Case C: Reject Di Ketua Komite Lalu Resubmit

Jalankan untuk semua bidang.

1. Login Verifikator bidang yang sama.
2. Approve proposal `FLOW-{slug}-REJECT-KETUA-KOMITE`.
3. Pastikan status menjadi `verified`.
4. Login Kepala Madrasah.
5. Approve proposal.
6. Pastikan status menjadi `approved`.
7. Login Ketua Komite global.
8. Buka proposal.
9. Download `File Proposal` dan `File LPJ`.
10. Reject dengan:
   - Alasan: `Anggaran belum sesuai prioritas Ketua Komite untuk bidang {Bidang}.`
   - Saran: `Sesuaikan nominal, tambahkan dasar kebutuhan, dan ajukan ulang setelah revisi.`
11. Pastikan status menjadi `rejected`.
12. Login Pengusul bidang yang sama.
13. Pastikan alasan dan saran tampil.
14. Edit proposal dan upload ulang dua dokumen revisi.
15. Submit ulang.
16. Login Verifikator bidang yang sama.
17. Approve ulang.
18. Login Kepala Madrasah.
19. Approve ulang.
20. Login Ketua Komite global.
21. Pastikan dokumen revisi dapat di-download.
22. Approve.
23. Lanjutkan ke Bendahara seperti Case A.

Expected:

- Reject Ketua Komite hanya valid saat status `approved`.
- Status berubah ke `rejected`.
- Field `rejected_by_role` bernilai `ketua_komite`.
- Proposal yang sudah direvisi kembali melewati Verifikator dan Kepala Madrasah sebelum Ketua Komite.

## 11. Case D: Reject Di Kepala Madrasah Lalu Resubmit

Jalankan untuk semua bidang.

1. Login Verifikator bidang yang sama.
2. Approve proposal `FLOW-{slug}-REJECT-KEPALA`.
3. Pastikan status menjadi `verified`.
4. Login Kepala Madrasah.
5. Buka proposal.
6. Download `File Proposal` dan `File LPJ`.
7. Reject dengan:
   - Alasan: `Proposal belum selaras dengan prioritas madrasah untuk bidang {Bidang}.`
   - Saran: `Perjelas urgensi, indikator manfaat, dan dampak kegiatan sebelum diajukan ulang.`
8. Pastikan status menjadi `rejected`.
9. Login Pengusul bidang yang sama.
10. Pastikan alasan dan saran tampil.
11. Edit proposal dan upload ulang dua dokumen revisi.
12. Submit ulang.
13. Login Verifikator bidang yang sama, approve ulang.
14. Login Kepala Madrasah, pastikan dokumen revisi dapat di-download.
15. Approve ulang.
16. Login Ketua Komite global, approve ulang.
17. Lanjutkan ke Bendahara seperti Case A.

Expected:

- Reject Kepala Madrasah hanya valid saat status `verified`.
- Status berubah ke `rejected`.
- Field `rejected_by_role` bernilai `kepala_madrasah`.
- Kepala Madrasah tetap dapat melihat proposal semua bidang.

## 12. Skenario RBAC Lintas Bidang

Jalankan minimal satu kali untuk setiap bidang pada role scoped (`pengusul` dan `verifikator`). Ketua Komite dan Kepala Madrasah tidak masuk skenario lintas bidang karena keduanya global.

Contoh untuk proposal bidang Pendidikan:

1. Login Verifikator HUMAS.
2. Buka daftar proposal.
3. Pastikan proposal Pendidikan tidak muncul.
4. Jika mengetahui URL detail proposal Pendidikan, coba akses langsung.
5. Coba download attachment proposal Pendidikan.
6. Login Pengusul HUMAS.
7. Jika mengetahui URL detail proposal Pendidikan, coba akses langsung dan coba download attachment.

Expected:

- Proposal bidang lain tidak muncul di daftar role scoped.
- Akses attachment bidang lain ditolak `403`.
- Download attachment bidang lain ditolak `403`.

Ulangi kombinasi:

| Proposal Bidang | User Salah Bidang |
| :--- | :--- |
| Pendidikan | Verifikator HUMAS, Pengusul HUMAS |
| HUMAS | Verifikator Sarpras, Pengusul Sarpras |
| Sarana dan Prasarana | Verifikator Sekretariat, Pengusul Sekretariat |
| Sekretariat Komite | Verifikator Pendidikan, Pengusul Pendidikan |

## 13. Skenario Validasi Upload Negatif

Jalankan minimal pada satu proposal draft dan satu proposal rejected.

| Skenario | Langkah | Expected |
| :--- | :--- | :--- |
| Tanpa file proposal | Upload hanya LPJ | Ditolak, UI menampilkan file proposal wajib |
| Tanpa file LPJ | Upload hanya proposal | Ditolak, UI menampilkan file LPJ wajib |
| File terlalu besar | Upload file > 1 MB | Ditolak di UI |
| Ekstensi tidak valid | Upload `.exe`, `.php`, atau `.js` | Ditolak di UI/backend |
| Tipe duplikat | Kirim dua file dengan `attachment_type=proposal` | Backend `422` |
| Upload setelah submitted | Coba upload saat status `submitted` | Backend `422` |
| Upload oleh bukan owner | Verifikator/Ketua Komite upload attachment | Backend `403` |
| Hapus attachment setelah submitted | Pengusul hapus attachment setelah submit | Backend `422` |

## 14. Skenario Download Per Tempat Proposal Singgah

Untuk setiap proposal, catat hasil download dua file attachment pada checkpoint berikut.

| Status Proposal | Aktor | Lokasi UI/API | Expected |
| :--- | :--- | :--- | :--- |
| `draft` | Pengusul pemilik | Detail proposal | Bisa list dan download |
| `submitted` | Verifikator bidang sama | Antrian persetujuan/detail | Bisa list dan download |
| `submitted` | Verifikator bidang lain | Direct URL/API | `403` |
| `verified` | Kepala Madrasah | Antrian persetujuan/detail | Bisa list dan download |
| `approved` | Ketua Komite global | Antrian persetujuan/detail | Bisa list dan download semua bidang |
| `final_approved` | Bendahara | Pembayaran/detail proposal | Bisa list dan download |
| `payment_processing` | Bendahara | Pembayaran/detail payment | Bisa download bukti pembayaran |
| `completed` | Pengusul/Bendahara/Admin | Detail proposal/payment | Bisa melihat ringkasan dan download dokumen relevan |

Endpoint yang harus teruji:

```text
GET /proposals/{proposalId}/attachments
GET /attachments/{attachmentId}/download
GET /payments/{paymentId}/download-proof
```

Expected header untuk attachment gzip:

```text
Content-Encoding: gzip
Content-Type: application/pdf
```

## 15. Skenario API Pendukung

Jika ingin memverifikasi lewat API selain UI, gunakan endpoint berikut dengan token user terkait.

| Aksi | Method | Endpoint |
| :--- | :--- | :--- |
| Login | POST | `/auth/login` |
| Buat proposal | POST | `/proposals` |
| Upload attachment | POST multipart | `/proposals/{proposalId}/attachments` |
| Submit proposal | POST | `/proposals/{proposalId}/submit` |
| Verifikasi | POST | `/proposals/{proposalId}/verify` |
| Approve Ketua Komite final | POST | `/proposals/{proposalId}/approve` |
| Reject | POST | `/proposals/{proposalId}/reject` |
| Approve Kepala Madrasah | POST | `/proposals/{proposalId}/final-approve` |
| Pending payment | GET | `/payments/pending` |
| Process payment | POST multipart | `/payments/{proposalId}/process` |
| Complete payment | POST | `/payments/{paymentId}/complete` |
| Download attachment | GET | `/attachments/{attachmentId}/download` |
| Download proof | GET | `/payments/{paymentId}/download-proof` |

Payload reject wajib cukup panjang:

```json
{
  "rejection_reason": "Alasan penolakan minimal sepuluh karakter.",
  "improvement_suggestions": "Saran perbaikan minimal dua puluh karakter agar validasi backend lolos."
}
```

## 16. Kriteria Lulus

Skenario dianggap lulus jika semua kondisi berikut terpenuhi:

1. Semua bidang bisa membuat proposal dengan RKAM bidangnya sendiri.
2. Setiap proposal memiliki dua attachment: `proposal` dan `lpj`.
3. Setiap attachment bisa di-download oleh pengusul pemilik.
4. Verifikator hanya melihat proposal bidangnya saat `submitted`.
5. Kepala Madrasah melihat proposal semua bidang saat `verified`.
6. Ketua Komite melihat proposal semua bidang saat `approved`.
7. Bendahara melihat proposal `final_approved` pada pembayaran pending.
8. Reject di Verifikator, Ketua Komite, dan Kepala Madrasah menghasilkan status `rejected` dan menyimpan alasan/saran.
9. Pengusul dapat edit dan upload ulang dokumen setelah reject.
10. Dokumen revisi menggantikan dokumen lama.
11. Role bidang lain tidak dapat download attachment proposal.
12. Bukti pembayaran dapat di-upload dan di-download.
13. Tidak ada error `ERR_NETWORK_REFUSED`, `401`, `403` tidak semestinya, `404 file missing`, atau `500`.

## 17. Template Catatan Hasil Eksekusi

Gunakan tabel ini saat menjalankan test manual.

| Bidang | Case | Proposal ID | Status Akhir | Upload Proposal | Upload LPJ | Download Pengusul | Download Verifikator | Download Ketua Komite | Download Kepala | Download Bendahara | RBAC Bidang Lain | Catatan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Pendidikan | A |  |  |  |  |  |  |  |  |  |  |  |
| Pendidikan | B |  |  |  |  |  |  |  |  |  |  |  |
| Pendidikan | C |  |  |  |  |  |  |  |  |  |  |  |
| Pendidikan | D |  |  |  |  |  |  |  |  |  |  |  |
| HUMAS | A |  |  |  |  |  |  |  |  |  |  |  |
| HUMAS | B |  |  |  |  |  |  |  |  |  |  |  |
| HUMAS | C |  |  |  |  |  |  |  |  |  |  |  |
| HUMAS | D |  |  |  |  |  |  |  |  |  |  |  |
| Sarana dan Prasarana | A |  |  |  |  |  |  |  |  |  |  |  |
| Sarana dan Prasarana | B |  |  |  |  |  |  |  |  |  |  |  |
| Sarana dan Prasarana | C |  |  |  |  |  |  |  |  |  |  |  |
| Sarana dan Prasarana | D |  |  |  |  |  |  |  |  |  |  |  |
| Sekretariat Komite | A |  |  |  |  |  |  |  |  |  |  |  |
| Sekretariat Komite | B |  |  |  |  |  |  |  |  |  |  |  |
| Sekretariat Komite | C |  |  |  |  |  |  |  |  |  |  |  |
| Sekretariat Komite | D |  |  |  |  |  |  |  |  |  |  |  |

## 18. Referensi Automated Test Yang Sudah Sejalan

Skenario ini selaras dengan test feature lokal berikut:

- `api-sirangkul/tests/Feature/FullApprovalWorkflowTest.php`
- `api-sirangkul/tests/Feature/ProposalAttachmentUploadTest.php`
- `api-sirangkul/tests/Feature/ProposalAttachmentDownloadTest.php`
- `api-sirangkul/tests/Feature/ProposalRejectionTest.php`
- `api-sirangkul/tests/Feature/PaymentRejectionTest.php`

Jika manual test sudah stabil, skenario ini dapat dijadikan dasar Playwright/UI E2E atau diperluas menjadi test command khusus yang membuat 16 proposal sesuai matriks.
