-- 🔧 Quick Fix untuk Proposal yang Stuck
-- Run this SQL di database PostgreSQL Anda

-- ========================================
-- 1. CEK PROPOSAL YANG STUCK
-- ========================================

-- Cek proposal < 50M yang stuck di status "approved"
SELECT 
    id,
    title,
    jumlah_pengajuan,
    status,
    requires_committee_approval,
    approved_at,
    final_approved_at,
    '❌ STUCK - Should be final_approved' as issue
FROM proposals
WHERE 
    status = 'approved' 
    AND requires_committee_approval = false
    AND approved_at IS NOT NULL
    AND final_approved_at IS NULL
ORDER BY approved_at DESC;

-- ========================================
-- 2. FIX STUCK PROPOSALS
-- ========================================

-- Fix semua proposal yang stuck
BEGIN;

UPDATE proposals 
SET 
    status = 'final_approved',
    final_approved_at = approved_at,
    final_approved_by = approved_by,
    updated_at = NOW()
WHERE 
    status = 'approved' 
    AND requires_committee_approval = false
    AND approved_at IS NOT NULL
    AND final_approved_at IS NULL;

-- Check berapa row yang diupdate
-- Seharusnya minimal 1 (proposal ID: 2865ac6b-19d3-429e-afc2-2ca92ce9b278)

COMMIT;

-- ========================================
-- 3. VERIFY FIX
-- ========================================

-- Cek proposal yang sudah di-fix
SELECT 
    id,
    title,
    jumlah_pengajuan,
    status,
    requires_committee_approval,
    approved_at,
    final_approved_at,
    CASE 
        WHEN status = 'final_approved' AND final_approved_at IS NOT NULL 
        THEN '✅ FIXED'
        ELSE '❌ STILL BROKEN'
    END as fix_status
FROM proposals
WHERE 
    requires_committee_approval = false
    AND approved_at IS NOT NULL
ORDER BY approved_at DESC
LIMIT 10;

-- ========================================
-- 4. CEK PAYMENT PENDING LIST
-- ========================================

-- Proposal yang sekarang harusnya muncul di Payment Management
SELECT 
    p.id,
    p.title,
    p.jumlah_pengajuan,
    p.status,
    p.final_approved_at,
    u.full_name as pengusul,
    r.kategori as rkam_kategori,
    CASE 
        WHEN pay.id IS NULL THEN '✅ Ready for payment'
        ELSE '⏳ Already has payment'
    END as payment_status
FROM proposals p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN rkam r ON p.rkam_id = r.id
LEFT JOIN payments pay ON pay.proposal_id = p.id
WHERE p.status = 'final_approved'
ORDER BY p.final_approved_at DESC;

-- ========================================
-- 5. FIX SPECIFIC PROPOSAL (Optional)
-- ========================================

-- Jika ingin fix hanya 1 proposal spesifik
-- Uncomment dan ganti ID-nya:

/*
UPDATE proposals 
SET 
    status = 'final_approved',
    final_approved_at = approved_at,
    final_approved_by = approved_by,
    updated_at = NOW()
WHERE id = '2865ac6b-19d3-429e-afc2-2ca92ce9b278';
*/

-- ========================================
-- 6. ROLLBACK (Emergency)
-- ========================================

-- Jika ada masalah, rollback dengan:

/*
BEGIN;

UPDATE proposals 
SET 
    status = 'approved',
    final_approved_at = NULL,
    final_approved_by = NULL
WHERE id = 'your-proposal-id';

COMMIT;
*/
