# 00 Panduan Standar Pengujian E2E SiRangkul

Dokumen ini adalah panduan utama untuk setiap Quality Assurance / Developer yang akan menguji API dan Frontend SiRangkul sebelum diturunkan ke sisi *Production*.
Semua pengujian wajib menggunakan **Real Browser Navigation** dan **API Request Simulation** secara bersamaan.

## 1. Filosofi Pengujian (The "Real-World" Approach)
Pengujian tidak boleh hanya via Postman lokal! Login harus berhasil mendapatkan token state, token ditempelkan di Header, lalu role pengguna diverifikasi kemampuannya terhadap endpoint yang tepat sesuai hak miliknya.

### Aturan Skema Pengujian 
1. **Never Test on Production DB directly**: Selalu gunakan mode `--env=testing` untuk menghindari kerusakan data sekolah asli.
2. **Clear Cache Before Any Run**: Biasakan `php artisan config:clear` sebelum suite dijalankan.
3. **Role Segregation is King**: Tes yang seharusnya ditujukan ke `/api/proposals` untuk 'pengusul', wajib gagal/ditolak (403 Forbidden) jika token yang diberikan milik 'komite_madrasah'.

## 2. Struktur Pengujian (The Pyramid)

### Level 1: Endpoint & Logic Sanity (Unit & Feature Test backend)
Pastikan status HTTP code sesuai dengan *Request and Response Standard* pada file `03-ui-integration-standards.md`.
- Validation Fail = 422
- Success Insert = 201
- Success Read/Update = 200
- Unknown URL = 404
- Token Invalid = 401
- Token Valid but Role Invalid = 403

### Level 2: Stateful Authentication (Sanctum)
Pastikan saat deploy VPS, CORS React tidak ditolak by Nginx dan login statelses tidak mendapat `419 CSRF Token Mismatch` seperti kejadian mitigasi sebelumnya.

### Level 3: Real Business Logic E2E (Simulasi Proposal)
1. **Admin** membuat *RKAM* Tahunan.
2. **Pengusul** (Guru) login, mengisi *form* dan upload PDF proposal.
3. **Verifikator** login, reject draf -> **Pengusul** merevisi draf ulang -> Resubmit.
4. **Verifikator** menyetujui.
5. **Komite** menyetujui.
6. **Kepala Madrasah** mem-final-approve.
7. **Bendahara** meng-input bukti bayar lunas.
- Seluruh 7 poin di atas wajib masuk logika hijau di automated script.

## 3. Direktori File Testing (`docs/testing`)
- `01-Persiapan-Deployment.md`: *Checklist pre-flight.*
- `02-e2e-testing-scheme.md`: *Simulasi Alur Dokumen.*
- `03-Alur-Utama-E2E.md`: *Detil Langkah-langkah UI.*
- `04-Fitur-Kritis-Edge-Cases.md`: *Pemetaan batas validasi kritis (Keuangan, Manipulasi Akses).*
- `test_api_crud.sh` & `test_production_ready.sh`: Script verifikasi koneksi dan keamanan infrastruktur lewat bash.
- `test_penetration.sh`: Script pemindaian vulnerabilitas dasar (SQLi, XSS, Path Traversal, JWT Manipulation, Rate Limiting).
- `run_rbac_test.php`, `run_role_e2e_test.php`, & `run_routes_integration_test.php`: Script simulasi login Bearer, simulasi alur E2E, dan pengujian memetakan API UI Componenets secara menyeluruh.
- `run_all_tests.sh`: **MASTER TEST RUNNER**. Mengeksekusi seluruh skrip diagnostik secara berurutan.

## 4. Mekanisme Penyimpanan Hasil (`/results`)
Folder `docs/testing/results/` didedikasikan sepenuhnya untuk mengarsipkan riwayat log dari eksekusi *automated script* di atas.
**Fungsi Utama:**
1. **Audit Trail (*Bukti Testing*)**: Setiap eksekusi via `run_all_tests.sh` otomatis menghasilkan file log bertanggal, contoh: `test_run_20260305_154500.log`.
2. **Debugging Tingkat Lanjut**: Keberadaan folder ini memudahkan QA atau Developer melacak rekaman respons JSON utuh atau Error Code HTTP jika proses login *Bearer* atau RBAC terganggu tanpa mempengaruhi *output* layar secara langsung.
*Catatan*: Folder ini diabaikan (*gitignore* opsional) untuk mencegah *bloat* sistem di repositori, namun disarankan menyimpan minimal 1 hasil tes "Green" terakhir sebagai baselines.
