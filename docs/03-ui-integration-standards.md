# UI/UX & Integration Standards SiRangkul

Panduan ini wajib diikuti oleh para Frontend Engineers (`App.tsx`, halaman `pages/`) untuk memastikan API terintegrasi dengan mulus pada UI dan UX.

## 1. Komunikasi REST API (React Axios)
Semua komunikasi backend wajib menggunakan instance axios yang dikonfigurasi secara sentral (misal di `/src/services/api.ts`).
- **Base URL**: Lingkungan prod diarahkan ke `/api` dari base path.
- **Header**: Harus mengatur `Accept: 'application/json'` dan `Content-Type: 'application/json'` secara default.
- **Autentikasi**: Bearer Token yang didapatkan dari `/api/auth/login` harus disertakan pada header `Authorization` untuk setiap request privat.
- **Handling Token Expired**: Axios interceptor wajib menangani error respon staus `401 Unauthorized` secara global, bertugas untuk membersihkan `localStorage` dan meredirect user secara aman ke `/login`.

## 2. Standar Struktur Respon (Laravel Standard)

Sistem Laravel 12 di-setup dengan `Response API Standard`.

### Sukses (200, 201)
Semua response di format JSON.
- Tunggal:
```json
{
  "id": "abc...",
  "full_name": "Admin"
}
```
- Paginated:
```json
{
  "data": [
     { "id": "1", "name": "..." },
     { "id": "2", "name": "..." }
  ],
  "meta": { "total": 100, "per_page": 10, "current_page": 1 },
  "links": { "next": "url" }
}
```

### Error (4xx, 5xx)
- 404 (Not Found) untuk ID yang rusak atau di luar akses wewenang `role`.
- 422 (Unprocessable Entity) form validation:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required.", "The email must be a valid email address."],
    "total_anggaran": ["Total anggaran tidak boleh melebihi sisa RKAM."]
  }
}
```
*Tugas Frontend*: Tangkap status `422` lalu loop `error` object dan tampilkan teks merah tebal menempel pada form `<input>` spesifik, jangan hanya global *alert* modal!

## 3. Komponen UI Global

Standar estetika dari "SiRangkul" dirancang untuk tampak sangat profesional, minimalis, namun *rich*.
- Warna dan Palet: Ikuti tailwind configuration, berikan identitas visual sekolah. Gunakan glassmorphism, *soft drop-shadow*, mode gelap responsif jika dimungkinkan.
- Interaktivitas Tombol: Wajib terdapat animasi *loading spinner* ketika tombol _Submit_ dipencet (mencegah klik ganda yang fatal pada request seperti `/api/proposals/{id}/approve`).
- Tabel Data: Menggunakan pagination server-side (jangan loading seluruh data jika `count > 20`).
- Role-based Layout: Komponen sidebar dan dashboard harus *conditionally rendered* berdasarkan profil `role` token user tersebut.
