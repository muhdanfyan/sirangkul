# Routes and Components Integration

Dokumen referensi relasi (mapping) antara Halaman Frontend (React Router) dengan Endpoint API (Laravel Routes).

## Modul Autentikasi
| Frontend Route / Komponen | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/login` (LoginPage.tsx) | `/api/auth/login` | POST | Mengirim *email*, *password*. Menerima token Sanctum JSON. Token disimpan di localStorage/Context. |
| Global Layout / API Service | `/api/auth/me` | GET | Validasi saat halaman direfresh untuk mengecek token masih valid & mengambil data peran (`role`) untuk memblokir navigasi tidak sah. |
| Header Nav (LogoutButton.tsx)| `/api/auth/logout` | POST | Membatalkan (revoke) Token di backend dan membersihkan storage UI. |

## Modul Manajemen Pengguna (Administrator Only)
| Frontend Route | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/users` | `/api/users` | GET | List Data paginated. |
| (Modal Form Create) | `/api/users` | POST | Insert User baru. Harus ada validator `422` handler di UI. |
| `/users` (Action Dropdown)| `/api/users/{id}/status`| PUT/PATCH | Toggle Disable/Enable akun (misal guru pindah dinas). |

## Modul Perencanaan Anggaran (RKAM)
| Frontend Route | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/rkam` | `/api/rkam` | GET | Tabel Master RKAM aktif untuk tahun ajaran terkait. |
| `/rkam/create` | `/api/rkam` | POST | (Admin) Input Kode Program, Pagu, dsb. |

## Modul Pengajuan Proposal (Pengusul / Guru)
| Frontend Route | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/proposals/my-list` | `/api/proposals` | GET | Filter otomatis di backend: Menampilkan *HANYA* proposal buatan user `Auth::id()` ini. |
| `/proposals/create` | `/api/proposals` | POST | Formulir kompleks. Upload text dan upload file PDF (`Content-Type: multipart/form-data`). |

## Modul Verifikasi & Approval (Verifikator, Komite, Kamad)
| Frontend Route | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/workflow/pending` | `/api/proposals?status=...` | GET | Filter spesifik bedasarkan Role. Verifikator get status `Submitted`. Kamad get status `Approved`. |
| `/proposals/{id}` | `/api/proposals/{id}` | GET | Tampilan Detil lengkap + List lampiran + History workflow (Audit logs). |
| (Tombol ACC / TOLAK) | `/api/proposals/{id}/approve` | POST | Mengirim *Decision Action* dan mencatat *notes/alasan penolakan*. |

## Modul Pencairan (Bendahara)
| Frontend Route | Endpoint API Terkait | Metode | Deskripsi Alur |
| :--- | :--- | :--- | :--- |
| `/dashboard/bendahara`| `/api/proposals?status=Final_Approved` | GET | Melihat mana yang harus dicairkan. |
| `/payments/execute` | `/api/payments` | POST | Input realisasi transaksi dan Kwitansi PDF. Ubah status jadi `Funded`. |

## Aturan Komponen 
1. **Guards (`PrivateRoute`)**: Setiap React Route selain `/login` wajib dilindungi. Jika unauthenticated, redirect ke `/login`. Jika `role` tidak sesuai (misal: pengusul buka `/users`), tampilkan komponen `403 Forbidden` alih-alih request api.
2. **Skeleton Loaders**: Hindari UI kosong saat request. Gunakan komponen `Skeleton` (*shimmer effect*) selama interaksi API.
