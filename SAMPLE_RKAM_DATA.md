# 🎯 Contoh Data RKAM untuk Testing

## Sample Request & Response untuk Backend Developer

### 1. GET /api/rkam - Get All RKAM Items

**Request:**
```http
GET http://127.0.0.1:8000/api/rkam
Authorization: Bearer {token}
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
    "proposal_id": "8c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "item_name": "Laptop Dell Latitude 5420",
    "quantity": 10,
    "unit_price": 15000000,
    "total_price": 150000000
  },
  {
    "id": "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
    "proposal_id": "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
    "item_name": "Proyektor Epson EB-X05",
    "quantity": 5,
    "unit_price": 5500000,
    "total_price": 27500000
  },
  {
    "id": "5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
    "proposal_id": null,
    "item_name": "AC Split 1 PK Daikin",
    "quantity": 8,
    "unit_price": 4200000,
    "total_price": 33600000
  },
  {
    "id": "3f4a5b6c-7d8e-9f0a-1b2c-3d4e5f6a7b8c",
    "proposal_id": "2e3f4a5b-6c7d-8e9f-0a1b-2c3d4e5f6a7b",
    "item_name": "Meja Guru Kayu Jati",
    "quantity": 20,
    "unit_price": 1500000,
    "total_price": 30000000
  },
  {
    "id": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
    "proposal_id": "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
    "item_name": "Printer Canon G3010",
    "quantity": 3,
    "unit_price": 2500000,
    "total_price": 7500000
  }
]
```

---

### 2. PUT /api/rkam/{id} - Update RKAM Item

**Request:**
```http
PUT http://127.0.0.1:8000/api/rkam/9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "Laptop Dell Latitude 5430 (Updated)",
  "quantity": 12,
  "unit_price": 16000000
}
```

**Expected Response (200 OK):**
```json
{
  "id": "9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
  "proposal_id": "8c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "item_name": "Laptop Dell Latitude 5430 (Updated)",
  "quantity": 12,
  "unit_price": 16000000,
  "total_price": 192000000
}
```

---

### 3. DELETE /api/rkam/{id} - Delete RKAM Item

**Request:**
```http
DELETE http://127.0.0.1:8000/api/rkam/1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
Authorization: Bearer {token}
```

**Expected Response (200 OK):**
```json
{
  "message": "RKAM item deleted"
}
```

---

### 4. GET /api/proposals/{proposal_id}/rkam - Get RKAM by Proposal

**Request:**
```http
GET http://127.0.0.1:8000/api/proposals/8c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f/rkam
Authorization: Bearer {token}
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
    "proposal_id": "8c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "item_name": "Laptop Dell Latitude 5420",
    "quantity": 10,
    "unit_price": 15000000,
    "total_price": 150000000
  }
]
```

---

## 🗄️ SQL Dummy Data untuk Testing

```sql
-- Insert sample RKAM data
INSERT INTO rkam (id, proposal_id, item_name, quantity, unit_price, total_price) VALUES
('9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a', '8c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f', 'Laptop Dell Latitude 5420', 10, 15000000, 150000000),
('7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e', '6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d', 'Proyektor Epson EB-X05', 5, 5500000, 27500000),
('5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a', NULL, 'AC Split 1 PK Daikin', 8, 4200000, 33600000),
('3f4a5b6c-7d8e-9f0a-1b2c-3d4e5f6a7b8c', '2e3f4a5b-6c7d-8e9f-0a1b-2c3d4e5f6a7b', 'Meja Guru Kayu Jati', 20, 1500000, 30000000),
('1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', 'Printer Canon G3010', 3, 2500000, 7500000),
('9f0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c', NULL, 'Kursi Siswa Besi', 100, 350000, 35000000),
('7d8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a', NULL, 'Papan Tulis Whiteboard', 15, 800000, 12000000),
('5b6c7d8e-9f0a-1b2c-3d4e-5f6a7b8c9d0e', NULL, 'Komputer PC All-in-One', 25, 7000000, 175000000),
('3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a', NULL, 'Buku Paket Matematika', 500, 85000, 42500000),
('1f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c', NULL, 'Alat Peraga IPA', 1, 50000000, 50000000);
```

---

## 🧪 Testing dengan Postman/Thunder Client

### Step 1: Login
```http
POST http://127.0.0.1:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sirangkul.com",
  "password": "password"
}
```

Copy `token` dari response.

### Step 2: Get All RKAM
```http
GET http://127.0.0.1:8000/api/rkam
Authorization: Bearer {paste_token_here}
```

### Step 3: Update RKAM
```http
PUT http://127.0.0.1:8000/api/rkam/9d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a
Authorization: Bearer {paste_token_here}
Content-Type: application/json

{
  "quantity": 15,
  "unit_price": 16500000
}
```

### Step 4: Delete RKAM
```http
DELETE http://127.0.0.1:8000/api/rkam/1f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c
Authorization: Bearer {paste_token_here}
```

---

## 📊 Expected Frontend Display

Setelah backend endpoint tersedia, frontend akan menampilkan:

| Nama Item | Qty | Harga Satuan | Pagu | Terpakai | Sisa | Progress | Status |
|-----------|-----|--------------|------|----------|------|----------|--------|
| Laptop Dell Latitude 5420 | 10 | Rp 15.000.000 | Rp 150.000.000 | Rp 0 | Rp 150.000.000 | ▓░░░░░░░░░ 0% | Normal |
| Proyektor Epson EB-X05 | 5 | Rp 5.500.000 | Rp 27.500.000 | Rp 0 | Rp 27.500.000 | ▓░░░░░░░░░ 0% | Normal |
| AC Split 1 PK Daikin | 8 | Rp 4.200.000 | Rp 33.600.000 | Rp 0 | Rp 33.600.000 | ▓░░░░░░░░░ 0% | Normal |

**Summary Cards:**
- **Total Pagu:** Rp 563.600.000
- **Terpakai:** Rp 0
- **Sisa Anggaran:** Rp 563.600.000

---

## ✅ Checklist untuk Backend Developer

- [ ] Tambah method `indexAll()` di `RkamController.php`
- [ ] Tambah route `GET /api/rkam` di `routes/api.php`
- [ ] Insert sample data RKAM ke database
- [ ] Test endpoint dengan Postman/Thunder Client
- [ ] Verifikasi response sesuai format yang diharapkan
- [ ] Update method `update()` agar auto-calculate `total_price`
- [ ] Koordinasi dengan frontend developer untuk testing integrasi

---

**Contact:** Koordinasikan dengan frontend developer setelah endpoint siap! 🚀
