# 04 Fitur Kritis & Edge Cases

Dokumen ini memetakan skenario-skenario batas (*edge cases*) dan fitur-fitur kritis yang rentan mengalami *bug* saat *production*, yang harus mendapat porsi pengujian lebih ketat.

## 1. Validasi Pembiayaan & Anggaran (Critical)
- **Skenario RKAM Minus**: Pengusul mengajukan dana `15.000` dari RKAM yang sisanya tinggal `10.000`.
   - *Expected Result*: API mengembalikan status `422 Unprocessable Entity` dengan pesan error: "Total anggaran melebihi sisa RKAM". Sisa anggaran pada RKAM tidak boleh berubah sedikitpun.
- **Skenario Bendahara Mencairkan Beda Nilai**: Bendahara melakukan finalisasi (`Funded`) dengan jumlah pencairan yang aslinya lebih kecil atau lebih besar dari *Total Anggaran* yang disetujui Kepala Madrasah.
   - *Expected Result*: Sistem harus menerima angka riil pencairan dari Bendahara dan meng-update *Realisasi* di Master RKAM berdasarkan input final bendahara tersebut, bukan nilai *Draft* proposal awal.

## 2. Keamanan & Manipulasi Akses (Security Edge Cases)
- **Edit Draf Silang**: Pengusul A melakukan request `PUT /api/proposals/<ID_MIlIK_PENGUSUL_B>`.
   - *Expected Result*: API `403 Forbidden` atau `404 Not Found` sebelum mencapai validasi form. Data tidak tertimpa.
- **Role Melampaui Batas (Vertical Privilege Escalation)**: Verifikator mengirim API Request mem-bypass persetujuan akhir Kepala Madrasah secara langsung (`POST /api/proposals/{id}/approve` menggunakan parameter status *Final_Approved* milik Kamad).
   - *Expected Result*: Harus ada layer proteksi di `ApprovalService` yang menegecek kecocokan `Status Target` dengan token `Role` pelaksana. Harus ditolak secara internal (403/Forbidden).

## 3. Limitasi Upload, Keamanan File & Jaringan
- **Payload Ekstra Besar Semua Komponen**: Pengguna mencoba meng-upload file media/dokumen (Proposal, Payment, atau Reporting) sebesar 100MB.
   - *Expected Result*: Ditolak otomatis oleh Server (Nginx) dengan `413 Payload Too Large`. Frontend bereaksi dengan *graceful fail*, mengarahkan pengguna untuk mengecilkan ukuran tanpa aplikasi menjadi *white screen*.
- **Malicious File Extension Bypass (XSS/Shell)**: Pengguna menyisipkan script berbahaya (e.g., `bukti.jpg.php` atau `dokumen.pdf.exe`) pada input upload Proposal, Payment, maupun Reporting.
   - *Expected Result*: API mengembalikan `422 Unprocessable Entity`. Validator MIME backend secara tegas menolak eksekusi dan memblokir file yang tidak murni PDF/JPG/PNG.
- **Concurrency Submission**: Dua verifikator menekan tombol "Approve" secara bersamaan di ms (milisecond) yang sama pada proposal yang sama.
   - *Expected Result*: Salah satu akan mendapatkan HTTP `409 Conflict` atau `422`, karena proposal tidak lagi memiliki status `Submitted` ketika klik ke-dua tiba di server. Database mengamankan state dengan Transaction Lock (Pessimistic Locking).
