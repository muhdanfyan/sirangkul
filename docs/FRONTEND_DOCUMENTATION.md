# Frontend Documentation - SiRangkul

> **Dokumen Konsolidasi**: Gabungan dari semua dokumentasi frontend  
> **Tanggal**: November 2025  
> **Frontend**: React + TypeScript + Tailwind CSS

---

## Table of Contents

1. [Page Components](#page-components)
2. [API Service](#api-service)
3. [UI Components](#ui-components)
4. [User Flows](#user-flows)
5. [Implementation Status](#implementation-status)

---

## Page Components

### Core Pages

| File | Description | API Endpoints |
|------|-------------|---------------|
| `LoginPage.tsx` | User authentication | `POST /api/auth/login` |
| `Dashboard.tsx` | Overview & metrics | `/api/dashboard/summary` |
| `UserManagement.tsx` | User CRUD | `/api/users` |
| `ProposalSubmission.tsx` | Create/edit proposals | `/api/proposals`, `/api/rkam` |
| `ProposalTracking.tsx` | Track proposal status | `/api/proposals/my` |
| `ProposalApproval.tsx` | Approve/reject proposals | `/api/proposals/{id}/verify`, `/approve`, `/reject` |
| `RKAMManagement.tsx` | RKAM CRUD | `/api/rkam` |
| `RAKMViewer.tsx` | View RKAM documents | `/api/rakm/{id}` |
| `PaymentManagement.tsx` | Process payments | `/api/payments` |
| `MyProposals.tsx` | Pengusul dashboard | `/api/proposals/my-proposals` |
| `FeedbackManagement.tsx` | Manage feedback | `/api/feedback` |
| `AuditLog.tsx` | System activity logs | `/api/audit-logs` |
| `Reporting.tsx` | Generate reports | `/api/reports` |

---

## API Service

### File: `src/services/api.ts`

### Interfaces

```typescript
interface Payment {
  id: string;
  proposal_id: string;
  amount: string;
  recipient_name: string;
  recipient_account: string;
  bank_name?: string;
  payment_method: 'transfer' | 'cash' | 'check';
  payment_reference?: string;
  payment_proof_url?: string;
  payment_proof_file?: string;  // Added for file upload
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
  admin_notes?: string;
  processed_at?: string;
  completed_at?: string;
}

interface ProposalStats {
  total: number;
  draft: number;
  submitted: number;
  verified: number;
  approved: number;
  final_approved: number;
  rejected: number;
  completed: number;
  total_amount_completed: number;
}
```

### API Methods

```typescript
// Authentication
login(email: string, password: string): Promise<LoginResponse>

// Proposals
getAllProposals(filters?): Promise<Proposal[]>
getProposalById(id: string): Promise<Proposal>
createProposal(data): Promise<Proposal>
submitProposal(id: string): Promise<Response>
verifyProposal(id: string): Promise<Response>
approveProposal(id: string): Promise<Response>
rejectProposal(id: string, reason: string): Promise<Response>
getMyProposals(): Promise<Proposal[]>  // For Pengusul
getProposalStatistics(): Promise<ProposalStats>

// RKAM
getAllRKAM(): Promise<RKAM[]>
getRKAMById(id: string): Promise<RKAM>
createRKAM(data): Promise<RKAM>
updateRKAM(id: string, data): Promise<RKAM>

// Payments
getAllPayments(): Promise<Payment[]>
getPendingPayments(): Promise<Proposal[]>
processPayment(proposalId: string, data): Promise<Response>
completePayment(paymentId: string, data): Promise<Response>
completePaymentWithFile(paymentId: string, formData: FormData): Promise<Response>
cancelPayment(paymentId: string, reason: string): Promise<Response>
downloadPaymentProof(paymentId: string): Promise<Blob>
```

---

## UI Components

### Toast Notification (`src/components/Toast.tsx`)

Auto-dismiss notification for quick feedback.

```tsx
// Tipe: success, error, warning, info
setToast({ 
  message: 'Pembayaran berhasil diproses!', 
  type: 'success' 
});
```

### ConfirmModal (`src/components/ConfirmModal.tsx`)

Confirmation dialog for important actions.

```tsx
setConfirmModal({
  isOpen: true,
  title: 'Submit Proposal',
  message: 'Apakah Anda yakin?',
  type: 'info',  // danger, warning, info, success
  onConfirm: () => handleSubmit()
});
```

### CancelModal (`src/components/CancelModal.tsx`)

Modal with textarea for cancellation reasons.

```tsx
setCancelModal({ isOpen: true, payment: selectedPayment });
```

### InfoModal (`src/components/InfoModal.tsx`)

Information display modal.

```tsx
setInfoModal({
  isOpen: true,
  title: 'Pembayaran Berhasil!',
  message: 'RKAM telah diperbarui...',
  type: 'success'
});
```

### PaymentProofModal (`src/components/PaymentProofModal.tsx`)

View/download payment proof files.

---

## User Flows

### For Pengusul

1. **Submit Proposal** → ProposalSubmission
2. **Track Status** → MyProposals (sidebar: "Proposal Saya")
3. **View Statistics** → Total, approved, rejected, paid
4. **If Rejected** → See rejection reason in red box
5. **If Completed** → Click "Bukti Bayar" → View/Download

### For Bendahara

1. **Process Payment** → PaymentManagement
2. **Complete Payment** → Upload proof (file OR URL required)
3. **RKAM Updated** → Automatically

### For Verifikator/Kepala/Komite

1. **View Pending** → ApprovalWorkflow
2. **Approve/Reject** → With confirmation modal
3. **Rejection** → Reason required

---

## Implementation Status

### ✅ Completed Features

| Feature | Status |
|---------|--------|
| Toast notifications | ✅ Implemented |
| Confirmation modals | ✅ Implemented |
| Payment proof upload | ✅ File + URL |
| My Proposals page | ✅ With stats |
| Rejection reason display | ✅ Red alert box |
| Payment info display | ✅ Green alert box |
| Download proof | ✅ Blob response |

### Routes Configuration

```tsx
// src/App.tsx
<Route path="/my-proposals" element={<MyProposals />} />
```

### Sidebar Menu

```tsx
// src/components/Layout/Sidebar.tsx
{ 
  icon: FileText, 
  label: 'Proposal Saya', 
  path: '/my-proposals', 
  roles: ['Pengusul'] 
}
```

---

## Validation Rules

### File Upload

- Max size: 10MB
- Allowed types: JPG, PNG, PDF
- Required: Either file OR URL

### Proposal Submission

- RKAM required
- Title & description required
- Amount must not exceed RKAM sisa

### Rejection

- Reason required (textarea)

---

## Design Patterns

### Color Scheme

| Type | Background | Text |
|------|------------|------|
| Success | green-50 | green-500/800 |
| Error | red-50 | red-500/800 |
| Warning | yellow-50 | yellow-500/800 |
| Info | blue-50 | blue-500/800 |

### Animation Timing

- Toast: 4s auto-dismiss
- Modal: 0.2s scale-in
- Redirect: 1.5s delay

---

*Dokumentasi ini dikonsolidasi dari: FRONTEND_API_INTEGRATION.md, FRONTEND_IMPLEMENTATION_COMPLETE.md, FRONTEND_PROPOSAL_TODO.md, FRONTEND_TODO_PAYMENT_ENHANCEMENT.md, TOAST_MODAL_IMPLEMENTATION.md*
