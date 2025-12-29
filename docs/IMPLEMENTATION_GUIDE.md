# Implementation Guide - SiRangkul

> **Dokumen Konsolidasi**: Panduan implementasi dan testing  
> **Tanggal**: November 2025

---

## Table of Contents

1. [Proposal Approval Workflow](#proposal-approval-workflow)
2. [Quick Fixes](#quick-fixes)
3. [Testing Guide](#testing-guide)
4. [Troubleshooting](#troubleshooting)

---

## Proposal Approval Workflow

### Status Flow

```
Budget ≤ 50M:
draft → submitted → verified → final_approved → payment_processing → completed
                                    ↑
                            (auto, skip komite)

Budget > 50M:
draft → submitted → verified → approved → final_approved → payment_processing → completed
                                   ↑            ↑
                               (kepala)     (komite)
```

### Threshold

- **≤ Rp 50.000.000**: Auto final_approved setelah Kepala Madrasah approve
- **> Rp 50.000.000**: Butuh persetujuan Komite Madrasah

---

## Quick Fixes

### Fix Stuck Proposals

Proposal yang stuck di status `approved` padahal `requires_committee_approval = false`:

```sql
UPDATE proposals 
SET 
    status = 'final_approved',
    final_approved_at = approved_at,
    final_approved_by = approved_by
WHERE 
    status = 'approved' 
    AND requires_committee_approval = false
    AND approved_at IS NOT NULL
    AND final_approved_at IS NULL;
```

### Fix Role Case Sensitivity

```sql
UPDATE users SET role = LOWER(TRIM(role));
```

### Standardize Roles

```sql
UPDATE users SET role = 'kepala_madrasah' 
WHERE role IN ('Kepala Madrasah', 'kepala madrasah', 'KepMad');

UPDATE users SET role = 'komite' 
WHERE role IN ('Komite', 'Komite Madrasah');
```

---

## Testing Guide

### Test Proposal < 50M (Auto Final Approve)

```bash
# 1. Create proposal
curl -X POST "http://127.0.0.1:8000/api/proposals" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"rkam_id":"uuid","title":"Test 30M","jumlah_pengajuan":30000000}'

# 2. Submit
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/submit"

# 3. Verify (as Verifikator)
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/verify"

# 4. Approve (as Kepala) - Should auto final_approved
curl -X POST "http://127.0.0.1:8000/api/proposals/{id}/approve"
```

**Expected:** Status langsung `final_approved`

### Test Proposal > 50M (Need Committee)

```bash
# Same steps, but with jumlah_pengajuan: 75000000
# After Kepala approve: status = approved (not final_approved)
# Need Komite to final approve
```

### Test Payment Flow

```bash
# 1. Get pending
curl -X GET "http://127.0.0.1:8000/api/payments/pending"

# 2. Process payment
curl -X POST "http://127.0.0.1:8000/api/payments/{proposalId}/process" \
  -d '{"recipient_name":"Test","recipient_account":"123","payment_method":"transfer"}'

# 3. Complete payment
curl -X POST "http://127.0.0.1:8000/api/payments/{id}/complete" \
  -d '{"payment_proof_url":"http://example.com/proof.pdf"}'
```

---

## Troubleshooting

### Problem: Proposal tidak muncul di Payment Management

**Check:**
```sql
SELECT id, status, final_approved_at FROM proposals WHERE status = 'final_approved';
```

**Solution:** Run fix stuck proposals SQL

### Problem: Authorization Error

**Check role di browser:**
```javascript
const user = JSON.parse(localStorage.getItem('sirangkul_user') || '{}');
console.log('Role:', user.role);
```

**Solution:** Update role di database, logout/login ulang

### Problem: RKAM tidak terupdate

**Check:**
```sql
SELECT id, pagu, terpakai, sisa FROM rkam WHERE id = 'xxx';
```

**Solution:** Verify payment complete endpoint is updating RKAM

---

## Common Commands

```bash
# Laravel
php artisan migrate
php artisan db:seed --class=RkamSeeder
php artisan optimize:clear
php artisan serve --host=127.0.0.1 --port=8000

# Check logs
tail -f storage/logs/laravel.log

# Tinker
php artisan tinker
>>> \App\Models\Proposal::where('status', 'final_approved')->count()
```

---

## Environment

### VPS Credentials

```
Server: VPS sirangkul
User: pi
Password: Piblajar2020
```

### Database

```
Host: localhost
Database: sirangkul_db
User: root
Password: 1234567890
```

---

## Verification Checklist

- [ ] Proposal ≤ 50M auto final_approved
- [ ] Proposal > 50M butuh Komite
- [ ] Payment muncul setelah final_approved
- [ ] RKAM terupdate setelah payment complete
- [ ] Rejection reason tersimpan
- [ ] Role authorization bekerja

---

*Dokumentasi ini dikonsolidasi dari: IMPLEMENTATION_GUIDE.md, PROPOSAL_APPROVAL_TESTING.md, PROPOSAL_WORKFLOW_REFERENCE.md, RKAM_INTEGRATION_COMPLETE.md, RKAM_INTEGRATION_SUMMARY.md, PAYMENT_IMPLEMENTATION_STATUS.md*
