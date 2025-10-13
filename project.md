# Backend Needs & API Endpoints

This document outlines the backend requirements and estimated API endpoints for the SiRangkul application, based on the database schema and frontend components.

## 1. Authentication

- **`POST /api/auth/login`**: User login.

  - **Request Body**: `{ "email": "user@example.com", "password": "password" }`
  - **Response Body**: `{ "token": "jwt_token", "user": { "id": "user_id", "full_name": "User Name", "role": "user_role" } }`
  - **Database Tables**: `users`
- **`POST /api/auth/logout`**: User logout.

  - **Request Body**: None
  - **Response Body**: `{ "message": "Logout successful" }`
  - **Database Tables**: None
- **`GET /api/auth/me`**: Get the currently authenticated user.

  - **Request Body**: None
  - **Response Body**: `{ "id": "user_id", "full_name": "User Name", "role": "user_role" }`
  - **Database Tables**: `users`

## 2. Users

- **`GET /api/users`**: Get a list of users.

  - **Query Params**: `?role=pengusul`
  - **Response Body**: `[{ "id": "user_id", "full_name": "User Name", "email": "user@example.com", "role": "user_role" }]`
  - **Database Tables**: `users`
- **`POST /api/users`**: Create a new user.

  - **Request Body**: `{ "full_name": "New User", "email": "new@example.com", "password": "password", "role": "pengusul" }`
  - **Response Body**: `{ "id": "new_user_id", "full_name": "New User", "email": "new@example.com", "role": "pengusul" }`
  - **Database Tables**: `users`
- **`GET /api/users/{id}`**: Get a single user by ID.

  - **Response Body**: `{ "id": "user_id", "full_name": "User Name", "email": "user@example.com", "role": "user_role" }`
  - **Database Tables**: `users`
- **`PUT /api/users/{id}`**: Update a user.

  - **Request Body**: `{ "full_name": "Updated Name" }`
  - **Response Body**: `{ "id": "user_id", "full_name": "Updated Name", "email": "user@example.com", "role": "user_role" }`
  - **Database Tables**: `users`
- **`DELETE /api/users/{id}`**: Delete a user.

  - **Response Body**: `{ "message": "User deleted" }`
  - **Database Tables**: `users`

## 3. Proposals

- **`GET /api/proposals`**: Get a list of proposals.

  - **Query Params**: `?status=submitted`
  - **Response Body**: `[{ "id": "proposal_id", "title": "Proposal Title", "status": "submitted", "submitted_at": "timestamp" }]`
  - **Database Tables**: `proposals`
- **`POST /api/proposals`**: Create a new proposal.

  - **Request Body**: `{ "title": "New Proposal", "description": "Proposal description" }`
  - **Response Body**: `{ "id": "new_proposal_id", "title": "New Proposal", "status": "draft", ... }`
  - **Database Tables**: `proposals`
- **`GET /api/proposals/{id}`**: Get a single proposal by ID.

  - **Response Body**: `{ "id": "proposal_id", "title": "Proposal Title", ..., "rkam": [], "attachments": [] }`
  - **Database Tables**: `proposals`, `rkam`, `proposal_attachments`
- **`PUT /api/proposals/{id}`**: Update a proposal.

  - **Request Body**: `{ "title": "Updated Title" }`
  - **Response Body**: `{ "id": "proposal_id", "title": "Updated Title", ... }`
  - **Database Tables**: `proposals`
- **`DELETE /api/proposals/{id}`**: Delete a proposal.

  - **Response Body**: `{ "message": "Proposal deleted" }`
  - **Database Tables**: `proposals`

## 4. RKAM (Rencana Kegiatan dan Anggaran Madrasah)

- **`GET /api/proposals/{proposal_id}/rkam`**: Get RKAM items for a proposal.

  - **Response Body**: `[{ "id": "rkam_id", "item_name": "Item Name", "quantity": 1, "unit_price": 10000, "total_price": 10000 }]`
  - **Database Tables**: `rkam`
- **`POST /api/proposals/{proposal_id}/rkam`**: Add an RKAM item to a proposal.

  - **Request Body**: `{ "item_name": "New Item", "quantity": 2, "unit_price": 5000 }`
  - **Response Body**: `{ "id": "new_rkam_id", ... }`
  - **Database Tables**: `rkam`
- **`PUT /api/rkam/{id}`**: Update an RKAM item.

  - **Request Body**: `{ "quantity": 3 }`
  - **Response Body**: `{ "id": "rkam_id", "quantity": 3, ... }`
  - **Database Tables**: `rkam`
- **`DELETE /api/rkam/{id}`**: Delete an RKAM item.

  - **Response Body**: `{ "message": "RKAM item deleted" }`
  - **Database Tables**: `rkam`

## 5. Payments

- **`GET /api/payments`**: Get a list of payments.

  - **Query Params**: `?status=pending`
  - **Response Body**: `[{ "id": "payment_id", "proposal_id": "proposal_id", "amount": 50000, "status": "pending" }]`
  - **Database Tables**: `payments`
- **`POST /api/payments`**: Create a new payment.

  - **Request Body**: `{ "proposal_id": "proposal_id", "amount": 50000 }`
  - **Response Body**: `{ "id": "new_payment_id", ... }`
  - **Database Tables**: `payments`
- **`GET /api/payments/{id}`**: Get a single payment by ID.

  - **Response Body**: `{ "id": "payment_id", ... }`
  - **Database Tables**: `payments`
- **`PUT /api/payments/{id}`**: Update a payment.

  - **Request Body**: `{ "status": "paid" }`
  - **Response Body**: `{ "id": "payment_id", "status": "paid", ... }`
  - **Database Tables**: `payments`

## 6. Feedback

- **`GET /api/feedback`**: Get a list of feedback.

  - **Query Params**: `?proposal_id=...`
  - **Response Body**: `[{ "id": "feedback_id", "user_id": "user_id", "message": "Feedback message" }]`
  - **Database Tables**: `feedback`
- **`POST /api/feedback`**: Create a new feedback.

  - **Request Body**: `{ "proposal_id": "proposal_id", "message": "New feedback" }`
  - **Response Body**: `{ "id": "new_feedback_id", ... }`
  - **Database Tables**: `feedback`

## 7. Audit Logs

- **`GET /api/audit-logs`**: Get a list of audit logs.
  - **Response Body**: `[{ "id": "log_id", "user_id": "user_id", "action": "user_login", "details": {} }]`
  - **Database Tables**: `audit_logs`

## 8. Approval Workflows

- **`GET /api/proposals/{proposal_id}/approvals`**: Get approval status for a proposal.

  - **Response Body**: `[{ "id": "approval_id", "approver_id": "user_id", "status": "pending" }]`
  - **Database Tables**: `approval_workflows`
- **`POST /api/proposals/{proposal_id}/approvals`**: Approve or reject a proposal.

  - **Request Body**: `{ "status": "approved", "notes": "Looks good" }`
  - **Response Body**: `{ "id": "new_approval_id", ... }`
  - **Database Tables**: `approval_workflows`

## 9. Proposal Attachments

- **`POST /api/proposals/{proposal_id}/attachments`**: Upload a proposal attachment.

  - **Request Body**: (multipart/form-data with file)
  - **Response Body**: `{ "id": "attachment_id", "file_name": "file.pdf", "file_path": "/path/to/file.pdf" }`
  - **Database Tables**: `proposal_attachments`
- **`DELETE /api/attachments/{id}`**: Delete a proposal attachment.

  - **Response Body**: `{ "message": "Attachment deleted" }`
  - **Database Tables**: `proposal_attachments`

## 10. Notifications

- **`GET /api/notifications`**: Get notifications for the current user.

  - **Response Body**: `[{ "id": "notification_id", "message": "New proposal submitted", "is_read": false }]`
  - **Database Tables**: `notifications`
- **`PUT /api/notifications/{id}/read`**: Mark a notification as read.

  - **Response Body**: `{ "message": "Notification marked as read" }`
  - **Database Tables**: `notifications`

## 11. General User Endpoint

- **`GET /api/user`**: Get the currently authenticated user's details. This endpoint is similar to `/api/auth/me`.

  - **Response Body**: `{ "id": "user_id", "full_name": "User Name", "email": "user@example.com", "role": "user_role" }`
  - **Database Tables**: `users`

## How to Access and Use the API

To interact with the API, you will typically use an HTTP client (e.g., Postman, Insomnia, or `curl`).

### Base URL

Your API's base URL is usually `http://127.0.0.1:8000` (or the address where your Laravel development server is running).

### Authentication

1. **Login:** Send a `POST` request to `/api/auth/login` with your `email` and `password` in the request body.

   ```json
   {
       "email": "admin@sirangkul.com",
       "password": "password"
   }
   ```
2. **Obtain Token:** The successful login response will include an `api_token`.

   ```json
   {
       "token": "your-api-token",
       "user": { ... }
   }
   ```
3. **Include Token in Requests:** For all subsequent authenticated requests, include this token in the `Authorization` header as a Bearer token:
   `Authorization: Bearer <your_api_token>`

   **Using Postman:**

   1. After a successful login, copy the `token` value from the response.
   2. In a new request in Postman, go to the "Authorization" tab.
   3. Select "Bearer Token" from the "Type" dropdown.
   4. Paste the copied token into the "Token" field.
   5. Postman will automatically add the `Authorization: Bearer <your_token>` header to your request.

### Making API Requests

1. **Construct URL:** Combine the Base URL with the specific endpoint path (e.g., `http://127.0.0.1:8000/api/users`).
2. **Choose HTTP Method:** Use the appropriate HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) as specified for each endpoint.
3. **Headers:** Include necessary headers, such as `Content-Type: application/json` for requests with a JSON body.
4. **Request Body:** For `POST`, `PUT`, and `PATCH` requests, provide the request body in JSON format as described in the endpoint documentation.
5. **Query Parameters:** For `GET` requests that accept query parameters, append them to the URL (e.g., `/api/users?role=pengusul`).

**Example `curl` command for login:**

```bash
curl -X POST \
  http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@sirangkul.com",
    "password": "password"
  }'
```

**Example `curl` command for an authenticated GET request:**

```bash
curl -X GET \
  http://127.0.0.1:8000/api/auth/me \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer <your_api_token>'
```
