
# Backend Needs & API Endpoints

This document outlines the backend requirements and a proposed API structure based on the database schema in `skema.sql`.

## Backend Needs

The application requires backend services for the following functionalities:

1.  **User Management & Authentication**: Handle user registration, login, roles, and profile management.
2.  **Proposal Management**: Create, read, update, and delete (CRUD) proposals and manage their lifecycle (draft, submitted, approved, rejected).
3.  **RKAM Management**: CRUD operations for RKAM items associated with proposals.
4.  **Payment Management**: Track and manage payments for approved proposals.
5.  **Feedback System**: Allow users to provide feedback on proposals.
6.  **Audit Trail**: Log significant user actions for security and compliance.
7.  **Approval Workflow**: Manage the multi-step approval process for proposals.
8.  **Reporting**: Generate reports based on proposals, payments, and other data.
9.  **Notifications**: Inform users about important events (e.g., proposal status changes).
10. **File Management**: Handle file uploads for proposal attachments.

## API Endpoint Estimations

### 1. Authentication

-   **Table**: `users`
-   **Endpoint**: `POST /api/auth/login`
    -   **Request**: `{ "email": "user@example.com", "password": "password123" }`
    -   **Response**: `{ "token": "jwt_token", "user": { "id": "uuid", "full_name": "User Name", "role": "user" } }`
-   **Endpoint**: `POST /api/auth/register`
    -   **Request**: `{ "email": "newuser@example.com", "password": "password123", "full_name": "New User" }`
    -   **Response**: `{ "message": "User registered successfully" }`
-   **Endpoint**: `GET /api/auth/me`
    -   **Request**: (Header: `Authorization: Bearer jwt_token`)
    -   **Response**: `{ "id": "uuid", "full_name": "User Name", "email": "user@example.com", "role": "user" }`

### 2. User Management

-   **Table**: `users`
-   **Endpoint**: `GET /api/users`
    -   **Response**: `[{ "id": "uuid", "full_name": "User Name", "email": "user@example.com", "role": "user" }]`
-   **Endpoint**: `GET /api/users/{id}`
    -   **Response**: `{ "id": "uuid", "full_name": "User Name", "email": "user@example.com", "role": "user" }`
-   **Endpoint**: `PUT /api/users/{id}`
    -   **Request**: `{ "full_name": "Updated Name", "role": "manager" }`
    -   **Response**: `{ "message": "User updated successfully" }`
-   **Endpoint**: `DELETE /api/users/{id}`
    -   **Response**: `{ "message": "User deleted successfully" }`

### 3. Proposal Management

-   **Table**: `proposals`
-   **Endpoint**: `GET /api/proposals`
    -   **Response**: `[{ "id": "uuid", "title": "Proposal Title", "status": "submitted", "submitted_at": "timestamp" }]`
-   **Endpoint**: `GET /api/proposals/{id}`
    -   **Response**: `{ "id": "uuid", "title": "Proposal Title", "description": "...", "status": "submitted", "user_id": "uuid", "rkam_items": [], "attachments": [] }`
-   **Endpoint**: `POST /api/proposals`
    -   **Request**: `{ "title": "New Proposal", "description": "..." }`
    -   **Response**: `{ "id": "new_proposal_uuid", "message": "Proposal created successfully" }`
-   **Endpoint**: `PUT /api/proposals/{id}`
    -   **Request**: `{ "title": "Updated Proposal Title", "description": "..." }`
    -   **Response**: `{ "message": "Proposal updated successfully" }`
-   **Endpoint**: `DELETE /api/proposals/{id}`
    -   **Response**: `{ "message": "Proposal deleted successfully" }`

### 4. RKAM Management

-   **Table**: `rkam`
-   **Endpoint**: `GET /api/proposals/{proposal_id}/rkam`
    -   **Response**: `[{ "id": "uuid", "item_name": "Item A", "quantity": 10, "unit_price": 100, "total_price": 1000 }]`
-   **Endpoint**: `POST /api/proposals/{proposal_id}/rkam`
    -   **Request**: `{ "item_name": "Item B", "quantity": 5, "unit_price": 50 }`
    -   **Response**: `{ "id": "new_rkam_item_uuid", "message": "RKAM item added" }`
-   **Endpoint**: `PUT /api/rkam/{id}`
    -   **Request**: `{ "item_name": "Updated Item B", "quantity": 6 }`
    -   **Response**: `{ "message": "RKAM item updated" }`
-   **Endpoint**: `DELETE /api/rkam/{id}`
    -   **Response**: `{ "message": "RKAM item deleted" }`

### 5. Payment Management

-   **Table**: `payments`
-   **Endpoint**: `GET /api/payments`
    -   **Response**: `[{ "id": "uuid", "proposal_id": "uuid", "amount": 5000, "status": "paid", "payment_date": "timestamp" }]`
-   **Endpoint**: `POST /api/payments`
    -   **Request**: `{ "proposal_id": "uuid", "amount": 5000, "payment_date": "timestamp" }`
    -   **Response**: `{ "id": "new_payment_uuid", "message": "Payment recorded" }`

### 6. Feedback Management

-   **Table**: `feedback`
-   **Endpoint**: `GET /api/proposals/{proposal_id}/feedback`
    -   **Response**: `[{ "id": "uuid", "user_id": "uuid", "message": "This is great!", "created_at": "timestamp" }]`
-   **Endpoint**: `POST /api/proposals/{proposal_id}/feedback`
    -   **Request**: `{ "message": "This needs improvement." }`
    -   **Response**: `{ "id": "new_feedback_uuid", "message": "Feedback submitted" }`

### 7. Audit Log

-   **Table**: `audit_logs`
-   **Endpoint**: `GET /api/audit-logs`
    -   **Response**: `[{ "id": "uuid", "user_id": "uuid", "action": "proposal_approved", "details": {}, "created_at": "timestamp" }]`

### 8. Approval Workflow

-   **Table**: `approval_workflows`
-   **Endpoint**: `GET /api/proposals/{proposal_id}/approvals`
    -   **Response**: `[{ "id": "uuid", "approver_id": "uuid", "status": "pending", "notes": "" }]`
-   **Endpoint**: `POST /api/proposals/{proposal_id}/approvals`
    -   **Request**: `{ "approver_id": "uuid" }`
    -   **Response**: `{ "message": "Approver added to workflow" }`
-   **Endpoint**: `PUT /api/approvals/{id}`
    -   **Request**: `{ "status": "approved", "notes": "Looks good." }`
    -   **Response**: `{ "message": "Approval status updated" }`

### 9. File Management

-   **Table**: `proposal_attachments`
-   **Endpoint**: `POST /api/proposals/{proposal_id}/attachments`
    -   **Request**: (Multipart form data with file)
    -   **Response**: `{ "id": "new_attachment_uuid", "file_name": "document.pdf", "url": "/files/document.pdf" }`
-   **Endpoint**: `DELETE /api/attachments/{id}`
    -   **Response**: `{ "message": "Attachment deleted" }`

### 10. Notifications

-   **Table**: `notifications`
-   **Endpoint**: `GET /api/notifications`
    -   **Response**: `[{ "id": "uuid", "message": "Your proposal has been approved.", "is_read": false, "created_at": "timestamp" }]`
-   **Endpoint**: `PUT /api/notifications/{id}/read`
    -   **Response**: `{ "message": "Notification marked as read" }`

## Role-Based Access Control (RBAC)

Based on the roles defined in `README.md`, the API access will be structured as follows:

### 👑 Administrator
- **User Management (`/api/users`):** Full CRUD access. Can create, read, update, and delete any user.
- **RKAM Management (`/api/rkam`):** Full CRUD access.
- **Payment Management (`/api/payments`):** Full CRUD access.
- **Audit Log (`/api/audit-logs`):** Full read access.
- **Feedback Management (`/api/feedback`):** Full CRUD access.
- **System Configuration:** Access to all system configuration endpoints.
- **All other endpoints:** Full access to all data.

### 👨‍💼 Pengusul (Proposer)
- **Proposal Management (`/api/proposals`):** Can create, read, update, and delete their *own* proposals. Access is restricted to proposals where the `user_id` matches their own.
- **Proposal Tracking:** Can view the status and approval history of their own proposals.
- **File Management (`/api/proposals/{proposal_id}/attachments`):** Can upload and delete attachments for their own proposals.
- **Reporting (`/api/reports`):** Can view reports related to their own proposals.

### 👩‍⚖️ Verifikator (Verifier)
- **Approval Workflow (`/api/approvals`):** Can view proposals assigned to them for verification and update their status (verify/reject).
- **Proposal Viewing:** Can read the details of proposals pending their verification.
- **Reporting (`/api/reports`):** Can view reports.

### 👨‍🏫 Kepala Madrasah (Head of School)
- **Approval Workflow (`/api/approvals`):** Can give final approval or rejection for verified proposals.
- **RKAM Management (`/api/rkam`):** Read-only access to monitor budgets.
- **Reporting (`/api/reports`):** Full access to view all reports.
- **Feedback Management (`/api/feedback`):** Can view and respond to feedback.
- **Dashboard:** Can view the main analytical dashboard.

### 💰 Bendahara (Treasurer)
- **Payment Management (`/api/payments`):** Can process and record payments for approved proposals.
- **RKAM Management (`/api/rkam`):** Can manage and update RKAM data.
- **Reporting (`/api/reports`):** Can generate and view financial reports.

### 🤝 Komite Madrasah (School Committee)
- **Approval Workflow (`/api/approvals`):** Can review and provide approval/recommendations on strategic proposals.
- **Reporting (`/api/reports`):** Can monitor program implementation and budgets through reports.
- **Proposal Tracking:** Can track the status of important proposals.

## Database Schema Recommendations

The existing `skema.sql` is a good foundation. The following tables should be added to support the full functionality of the application:

1.  **`proposal_attachments`**: To handle file uploads associated with proposals.
2.  **`notifications`**: To provide a notification system for users.

