# 🔄 Proposal Approval Workflow - Quick Reference

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSAL APPROVAL FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. DRAFT
   │
   │ submit() - by Pengusul
   ↓
2. SUBMITTED
   │
   │ verify() - by Verifikator
   ↓
3. VERIFIED
   │
   │ approve() - by Kepala Madrasah
   ↓
4. APPROVED
   │
   ├─→ IF requires_committee_approval = FALSE
   │   │ Auto-transition
   │   ↓
   │   6. FINAL_APPROVED
   │
   └─→ IF requires_committee_approval = TRUE
       │ finalApprove() - by Komite Madrasah
       ↓
       6. FINAL_APPROVED

7. PAYMENT_PROCESSING (by Bendahara - future)
   │
   ↓
8. COMPLETED

┌─────────────────────────────────────────────────────────────────┐
│                    REJECTION PATHS                              │
└─────────────────────────────────────────────────────────────────┘

SUBMITTED → reject() by Verifikator → REJECTED
VERIFIED  → reject() by Kepala Madrasah → REJECTED
APPROVED  → (no rejection from Komite, contact admin)
```

---

## Status Constants

```php
const STATUS_DRAFT = 'draft';
const STATUS_SUBMITTED = 'submitted';
const STATUS_VERIFIED = 'verified';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';
const STATUS_FINAL_APPROVED = 'final_approved';
const STATUS_PAYMENT_PROCESSING = 'payment_processing';
const STATUS_COMPLETED = 'completed';
```

---

## Role-Based Authorization Matrix

| Action | Endpoint | Role | Can Act On Status | Next Status |
|--------|----------|------|-------------------|-------------|
| **Create** | POST /proposals | Pengusul | - | draft |
| **Submit** | POST /proposals/{id}/submit | Pengusul (owner) | draft | submitted |
| **Verify** | POST /proposals/{id}/verify | Verifikator | submitted | verified |
| **Reject (V)** | POST /proposals/{id}/reject | Verifikator | submitted | rejected |
| **Approve** | POST /proposals/{id}/approve | Kepala Madrasah | verified | approved / final_approved* |
| **Reject (K)** | POST /proposals/{id}/reject | Kepala Madrasah | verified | rejected |
| **Final Approve** | POST /proposals/{id}/final-approve | Komite Madrasah | approved | final_approved |
| **View** | GET /proposals/{id} | Any authenticated | any | - |
| **Edit** | PUT /proposals/{id} | Pengusul (owner) | draft, rejected | - |
| **Delete** | DELETE /proposals/{id} | Pengusul (owner) | draft | - |

*Auto-transition to `final_approved` if `requires_committee_approval = false`

---

## Business Rules

### 1. Committee Approval Threshold
```php
$requiresCommittee = ($jumlah_pengajuan > 50000000); // > 50 juta
```

### 2. Budget Validation
```php
// Proposal jumlah_pengajuan must be <= RKAM.sisa
if ($jumlah_pengajuan > $rkam->sisa) {
    // Error: "Jumlah pengajuan melebihi sisa anggaran RKAM"
}
```

### 3. RKAM Budget Tracking
```php
// RKAM.terpakai = sum of approved proposals
$terpakai = Proposal::where('rkam_id', $rkam_id)
                    ->where('status', 'approved')
                    ->sum('jumlah_pengajuan');

$sisa = $rkam->pagu - $terpakai;
```

### 4. Status Permissions
- **Can Edit**: draft, rejected
- **Can Delete**: draft only
- **Can Submit**: draft only

---

## API Endpoints Summary

### CRUD Operations
```http
GET    /api/proposals              # List all proposals (with filters)
POST   /api/proposals              # Create new proposal
GET    /api/proposals/{id}         # View proposal detail
PUT    /api/proposals/{id}         # Update proposal (draft/rejected only)
DELETE /api/proposals/{id}         # Delete proposal (draft only)
```

### Action Operations
```http
POST   /api/proposals/{id}/submit        # Submit for verification
POST   /api/proposals/{id}/verify        # Verify proposal
POST   /api/proposals/{id}/approve       # Approve proposal
POST   /api/proposals/{id}/reject        # Reject proposal
POST   /api/proposals/{id}/final-approve # Final approval by committee
```

---

## Request/Response Examples

### Create Proposal
```json
// Request
POST /api/proposals
{
  "rkam_id": "uuid",
  "title": "Renovasi Ruang Kelas 7A",
  "description": "Perbaikan lantai, cat dinding",
  "jumlah_pengajuan": 30000000
}

// Response
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "id": "uuid",
    "status": "draft",
    "requires_committee_approval": false,
    "status_badge": "gray",
    "status_label": "Draft",
    "next_approver": null
  }
}
```

### Submit Proposal
```json
// Request
POST /api/proposals/{id}/submit

// Response
{
  "success": true,
  "message": "Proposal submitted successfully",
  "data": {
    "id": "uuid",
    "status": "submitted",
    "submitted_at": "2025-11-06T10:30:00Z",
    "next_approver": "Verifikator"
  }
}
```

### Verify Proposal
```json
// Request
POST /api/proposals/{id}/verify

// Response
{
  "success": true,
  "message": "Proposal verified successfully",
  "data": {
    "id": "uuid",
    "status": "verified",
    "verified_at": "2025-11-06T10:35:00Z",
    "verified_by": "verifikator-uuid",
    "next_approver": "Kepala Madrasah"
  }
}
```

### Reject Proposal
```json
// Request
POST /api/proposals/{id}/reject
{
  "rejection_reason": "Data tidak lengkap"
}

// Response
{
  "success": true,
  "message": "Proposal rejected",
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejected_at": "2025-11-06T10:40:00Z",
    "rejected_by": "verifikator-uuid",
    "rejection_reason": "Data tidak lengkap"
  }
}
```

---

## Database Schema Quick Ref

### proposals table (approval columns)
```sql
verified_at             TIMESTAMP NULL
verified_by             UUID NULL (FK users.id)
approved_at             TIMESTAMP NULL
approved_by             UUID NULL (FK users.id)
rejected_at             TIMESTAMP NULL
rejected_by             UUID NULL (FK users.id)
rejection_reason        TEXT NULL
final_approved_at       TIMESTAMP NULL
final_approved_by       UUID NULL (FK users.id)
completed_at            TIMESTAMP NULL
requires_committee_approval BOOLEAN DEFAULT FALSE
```

---

## Model Relationships

```php
// Proposal.php
public function user() // Pengusul
public function rkam() // Master budget
public function verifier() // User who verified
public function approver() // User who approved (Kepala)
public function rejector() // User who rejected
public function finalApprover() // User who final approved (Komite)
public function payments() // Payment records
public function attachments() // Documents
```

---

## Helper Methods

### Proposal Model
```php
$proposal->canBeEdited();    // true if draft or rejected
$proposal->canBeDeleted();   // true if draft only
$proposal->canBeSubmitted(); // true if draft only
$proposal->status_badge;     // 'gray', 'blue', 'cyan', 'purple', 'green', 'red'
$proposal->status_label;     // 'Draft', 'Submitted', 'Verified', etc.
$proposal->next_approver;    // 'Verifikator', 'Kepala Madrasah', 'Komite Madrasah', null
```

### User Model
```php
$user->hasRole('Verifikator');                      // true/false
$user->hasAnyRole(['Verifikator', 'Kepala Madrasah']); // true/false
```

---

## Error Codes Reference

| HTTP Code | Scenario | Message |
|-----------|----------|---------|
| **403** | Wrong role for action | "Unauthorized: Only {Role} can {action} proposals" |
| **403** | Not proposal owner | "Unauthorized: You can only submit your own proposals" |
| **422** | Invalid status transition | "Cannot {action}: Proposal status is '{status}'" |
| **422** | Missing rejection reason | "The rejection reason field is required." |
| **422** | Budget exceeded | "Jumlah pengajuan melebihi sisa anggaran RKAM" |
| **422** | Committee not required | "This proposal does not require committee approval" |
| **404** | Proposal not found | "No query results for model [Proposal]" |

---

## Frontend Integration Notes

### Status Badge Colors (Tailwind CSS)
```javascript
const statusColors = {
  'draft': 'bg-gray-100 text-gray-800',
  'submitted': 'bg-blue-100 text-blue-800',
  'verified': 'bg-cyan-100 text-cyan-800',
  'approved': 'bg-purple-100 text-purple-800',
  'rejected': 'bg-red-100 text-red-800',
  'final_approved': 'bg-green-100 text-green-800',
  'payment_processing': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-emerald-100 text-emerald-800'
};
```

### Conditional Rendering
```javascript
// Show Submit button
{proposal.status === 'draft' && proposal.user_id === currentUser.id && (
  <button onClick={handleSubmit}>Submit Proposal</button>
)}

// Show Verify button
{proposal.status === 'submitted' && currentUser.role === 'Verifikator' && (
  <button onClick={handleVerify}>Verify</button>
)}

// Show Approve button
{proposal.status === 'verified' && currentUser.role === 'Kepala Madrasah' && (
  <button onClick={handleApprove}>Approve</button>
)}

// Show Final Approve button
{proposal.status === 'approved' && 
 proposal.requires_committee_approval && 
 currentUser.role === 'Komite Madrasah' && (
  <button onClick={handleFinalApprove}>Final Approve</button>
)}
```

---

## Testing Checklist

- [ ] Create proposal < 50M → `requires_committee_approval = false`
- [ ] Create proposal > 50M → `requires_committee_approval = true`
- [ ] Submit draft → status changes to `submitted`
- [ ] Verify submitted → status changes to `verified`
- [ ] Approve < 50M → status changes to `final_approved` (skip committee)
- [ ] Approve > 50M → status changes to `approved` (needs committee)
- [ ] Final approve > 50M → status changes to `final_approved`
- [ ] Reject at verification stage → status changes to `rejected`
- [ ] Reject at approval stage → status changes to `rejected`
- [ ] Unauthorized role → 403 error
- [ ] Invalid status transition → 422 error
- [ ] Budget validation → 422 error if exceeds RKAM.sisa

---

**Implementation Complete! Ready for Testing! 🎉**
