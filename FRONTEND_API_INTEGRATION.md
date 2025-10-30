# Frontend API Integration Requirements

This document outlines the API endpoints that each frontend page/component in the `src/pages` directory is expected to consume. This serves as a guide for frontend developers to understand the data flow and integration points.

## API Documentation Source

All API endpoint details are sourced from `api-sirangkul/api-doc.md`.

---

## Page-wise API Consumption

### `LoginPage.tsx`

**Purpose:** Handles user authentication.

**Consumed API Endpoints:**

*   **Login:**
    *   **URL:** `/api/auth/login`
    *   **Method:** `POST`
    *   **Description:** Authenticates user credentials (email, password) and receives an authentication token and user details upon successful login.

---

### `Dashboard.tsx`

**Purpose:** Displays an overview of key information and metrics.

**Potential Consumed API Endpoints:**

*   **Dashboard Summary Data:** (e.g., `/api/dashboard/summary`) - To fetch aggregated data, counts, or recent activities.
*   **User Profile Data:** (e.g., `/api/user/profile`) - To display logged-in user's basic information.

---

### `UserManagement.tsx`

**Purpose:** Manages user accounts (create, read, update, delete).

**Potential Consumed API Endpoints:**

*   **List Users:** (e.g., `/api/users`) - To retrieve a list of all users.
*   **Get User Details:** (e.g., `/api/users/{id}`) - To fetch details of a specific user.
*   **Create User:** (e.g., `/api/users`) - To add a new user.
*   **Update User:** (e.g., `/api/users/{id}`) - To modify an existing user's details.
*   **Delete User:** (e.g., `/api/users/{id}`) - To remove a user.

---

### `ProposalSubmission.tsx`

**Purpose:** Allows users to submit new proposals.

**Potential Consumed API Endpoints:**

*   **Submit Proposal:** (e.g., `/api/proposals`) - To send new proposal data to the backend.
*   **Get Proposal Templates/Categories:** (e.g., `/api/proposal/templates`, `/api/proposal/categories`) - To populate forms with predefined options.

---

### `ProposalTracking.tsx`

**Purpose:** Displays the status and details of submitted proposals.

**Potential Consumed API Endpoints:**

*   **List User Proposals:** (e.g., `/api/proposals/my`) - To retrieve proposals submitted by the current user.
*   **Get Proposal Details:** (e.g., `/api/proposals/{id}`) - To fetch detailed information about a specific proposal.
*   **Get Proposal Status History:** (e.g., `/api/proposals/{id}/history`) - To view the workflow history of a proposal.

---

### `ApprovalWorkflow.tsx`

**Purpose:** Manages the approval process for proposals or other items.

**Potential Consumed API Endpoints:**

*   **List Pending Approvals:** (e.g., `/api/approvals/pending`) - To fetch items awaiting approval by the current user.
*   **Approve/Reject Item:** (e.g., `/api/approvals/{id}/approve`, `/api/approvals/{id}/reject`) - To update the status of an item in the workflow.
*   **Get Item Details for Approval:** (e.g., `/api/items/{id}`) - To view details of the item being approved.

---

### `RKAMManagement.tsx`

**Purpose:** Manages RKAM (Rencana Kegiatan dan Anggaran Madrasah) data.

**Potential Consumed API Endpoints:**

*   **List RKAM:** (e.g., `/api/rkam`) - To retrieve a list of RKAM entries.
*   **Get RKAM Details:** (e.g., `/api/rkam/{id}`) - To fetch details of a specific RKAM.
*   **Create RKAM:** (e.g., `/api/rkam`) - To add a new RKAM entry.
*   **Update RKAM:** (e.g., `/api/rkam/{id}`) - To modify an existing RKAM entry.
*   **Delete RKAM:** (e.g., `/api/rkam/{id}`) - To remove an RKAM entry.

---

### `RAKMViewer.tsx`

**Purpose:** Views RAKM (Rencana Anggaran Kegiatan Madrasah) documents or data.

**Potential Consumed API Endpoints:**

*   **Get RAKM Document/Data:** (e.g., `/api/rakm/{id}`, `/api/rakm/view/{id}`) - To fetch a specific RAKM document or its data for display.
*   **List Available RAKM:** (e.g., `/api/rakm`) - To get a list of RAKM documents that can be viewed.

---

### `PaymentManagement.tsx`

**Purpose:** Manages payment records and transactions.

**Potential Consumed API Endpoints:**

*   **List Payments:** (e.g., `/api/payments`) - To retrieve a list of payment records.
*   **Get Payment Details:** (e.g., `/api/payments/{id}`) - To fetch details of a specific payment.
*   **Record Payment:** (e.g., `/api/payments`) - To add a new payment record.
*   **Update Payment Status:** (e.g., `/api/payments/{id}/status`) - To change the status of a payment.

---

### `FeedbackManagement.tsx`

**Purpose:** Manages user feedback or suggestions.

**Potential Consumed API Endpoints:**

*   **List Feedback:** (e.g., `/api/feedback`) - To retrieve a list of all feedback entries.
*   **Get Feedback Details:** (e.g., `/api/feedback/{id}`) - To fetch details of a specific feedback.
*   **Update Feedback Status:** (e.g., `/api/feedback/{id}/status`) - To change the status (e.g., resolved, pending) of a feedback.

---

### `AuditLog.tsx`

**Purpose:** Displays system audit trails and activity logs.

**Potential Consumed API Endpoints:**

*   **List Audit Logs:** (e.g., `/api/audit-logs`) - To retrieve a paginated list of audit log entries.
*   **Filter Audit Logs:** (e.g., `/api/audit-logs?user=X&action=Y`) - To search and filter audit logs based on criteria.

---

### `Reporting.tsx`

**Purpose:** Generates and displays various reports.

**Potential Consumed API Endpoints:**

*   **Generate Report:** (e.g., `/api/reports/generate`) - To trigger report generation with specified parameters.
*   **List Available Reports:** (e.g., `/api/reports/types`) - To get a list of report types that can be generated.
*   **Get Report Data:** (e.g., `/api/reports/{id}/data`) - To fetch data for a specific report.

---
