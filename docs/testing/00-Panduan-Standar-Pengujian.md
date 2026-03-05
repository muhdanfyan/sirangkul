```markdown
### Level 4: Performance & Stress Testing
Memastikan sistem tetap stabil saat diakses oleh ratusan madrasah secara bersamaan, terutama pada periode pengajuan proposal serentak.
- **Concurrent Uploads**: Simulasi 50+ user melakukan upload PDF secara bersamaan.
- **Response Time**: Endpoint GET (list proposal) wajib merespon di bawah 2 detik dengan dataset > 1000 baris.

### Level 5: Security & Vulnerability Assessment
- **IDOR (Insecure Direct Object Reference)**: Pastikan Pengusul A tidak bisa melihat/mengedit proposal milik Pengusul B hanya dengan mengganti ID di URL/API.
- **File Integrity**: Validasi MIME type dan ukuran maksimal file (max 5MB) untuk mencegah serangan *Remote Code Execution* via upload.
- **Mass Assignment**: Pastikan field sensitif seperti `status_approval` tidak bisa diubah oleh Pengusul via request POST/PUT.

### Level 6: UI/UX Responsiveness & Cross-Browser
- **Mobile Compatibility**: Verifikasi dashboard tetap fungsional di resolusi mobile (untuk pemantauan cepat oleh Kepala Madrasah).
- **Browser Consistency**: Uji fungsionalitas utama pada Chrome, Firefox, dan Safari (terutama fitur *drag-and-drop* upload).
```
