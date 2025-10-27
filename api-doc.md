
# API Documentation

This document outlines the API endpoints for the SiRangkul application.

## Base URL

Your API's base URL is usually `http://127.0.0.1:8000` (or the address where your Laravel development server is running).

## Authentication

### 1. Login

Authenticates a user and returns an API token along with user details.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
- **Request Body:**
  ```json
  {
      "email": "user@example.com",
      "password": "password"
  }
  ```
- **Response Body:**
  ```json
  {
      "token": "jwt_token",
      "user": {
          "id": "user_id",
          "full_name": "User Name",
          "role": "user_role"
      }
  }
  ```

### 2. Logout

Logs out the currently authenticated user by revoking their API token.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "Logout successful"
  }
  ```

### 3. Get Authenticated User

Retrieves details of the currently authenticated user.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "id": "user_id",
      "full_name": "User Name",
      "role": "user_role"
  }
  ```

## Users

### 1. Get All Users

Retrieves a list of all users.

- **URL:** `/api/users`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  * `role`: (Optional) Filter users by role (e.g., `pengusul`).
- **Response Body:**
  ```json
  [
      {
          "id": "user_id",
          "full_name": "User Name",
          "email": "user@example.com",
          "role": "user_role"
      }
  ]
  ```

### 2. Create New User

Creates a new user.

- **URL:** `/api/users`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **Request Body:**
  ```json
  {
      "full_name": "New User",
      "email": "new@example.com",
      "password": "password",
      "role": "pengusul"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_user_id",
      "full_name": "New User",
      "email": "new@example.com",
      "role": "pengusul"
  }
  ```

### 3. Get User by ID

Retrieves details of a single user by their ID.

- **URL:** `/api/users/{id}`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the user.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "id": "user_id",
      "full_name": "User Name",
      "email": "user@example.com",
      "role": "user_role"
  }
  ```

### 4. Update User

Updates an existing user's details.

- **URL:** `/api/users/{id}`
- **Method:** `PUT`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the user to update.
- **Request Body:**
  ```json
  {
      "full_name": "Updated Name"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "user_id",
      "full_name": "Updated Name",
      "email": "user@example.com",
      "role": "user_role"
  }
  ```

### 5. Delete User

Deletes a user by their ID.

- **URL:** `/api/users/{id}`
- **Method:** `DELETE`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the user to delete.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "User deleted"
  }
  ```

## Proposals

### 1. Get All Proposals

Retrieves a list of all proposals.

- **URL:** `/api/proposals`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  * `status`: (Optional) Filter proposals by status (e.g., `submitted`).
- **Response Body:**
  ```json
  [
      {
          "id": "proposal_id",
          "title": "Proposal Title",
          "status": "submitted",
          "submitted_at": "timestamp"
      }
  ]
  ```

### 2. Create New Proposal

Creates a new proposal.

- **URL:** `/api/proposals`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **Request Body:**
  ```json
  {
      "title": "New Proposal",
      "description": "Proposal description"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_proposal_id",
      "title": "New Proposal",
      "status": "draft",
      "...": "other proposal details"
  }
  ```

### 3. Get Proposal by ID

Retrieves details of a single proposal by its ID, including associated RKAM items and attachments.

- **URL:** `/api/proposals/{id}`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the proposal.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "id": "proposal_id",
      "title": "Proposal Title",
      "...": "other proposal details",
      "rkam": [],
      "attachments": []
  }
  ```

### 4. Update Proposal

Updates an existing proposal's details.

- **URL:** `/api/proposals/{id}`
- **Method:** `PUT`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the proposal to update.
- **Request Body:**
  ```json
  {
      "title": "Updated Title"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "proposal_id",
      "title": "Updated Title",
      "...": "other proposal details"
  }
  ```

### 5. Delete Proposal

Deletes a proposal by its ID.

- **URL:** `/api/proposals/{id}`
- **Method:** `DELETE`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the proposal to delete.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "Proposal deleted"
  }
  ```

## RKAM (Rencana Kegiatan dan Anggaran Madrasah)

### 1. Get RKAM Items for a Proposal

Retrieves a list of RKAM items associated with a specific proposal.

- **URL:** `/api/proposals/{proposal_id}/rkam`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `proposal_id`: The ID of the proposal.
- **Request Body:** None
- **Response Body:**
  ```json
  [
      {
          "id": "rkam_id",
          "item_name": "Item Name",
          "quantity": 1,
          "unit_price": 10000,
          "total_price": 10000
      }
  ]
  ```

### 2. Add RKAM Item to a Proposal

Adds a new RKAM item to a specific proposal.

- **URL:** `/api/proposals/{proposal_id}/rkam`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `proposal_id`: The ID of the proposal.
- **Request Body:**
  ```json
  {
      "item_name": "New Item",
      "quantity": 2,
      "unit_price": 5000
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_rkam_id",
      "...": "other RKAM item details"
  }
  ```

### 3. Update RKAM Item

Updates an existing RKAM item.

- **URL:** `/api/rkam/{id}`
- **Method:** `PUT`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the RKAM item to update.
- **Request Body:**
  ```json
  {
      "quantity": 3
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "rkam_id",
      "quantity": 3,
      "...": "other RKAM item details"
  }
  ```

### 4. Delete RKAM Item

Deletes an RKAM item by its ID.

- **URL:** `/api/rkam/{id}`
- **Method:** `DELETE`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the RKAM item to delete.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "RKAM item deleted"
  }
  ```

## Payments

### 1. Get All Payments

Retrieves a list of all payments.

- **URL:** `/api/payments`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  * `status`: (Optional) Filter payments by status (e.g., `pending`).
- **Response Body:**
  ```json
  [
      {
          "id": "payment_id",
          "proposal_id": "proposal_id",
          "amount": 50000,
          "status": "pending"
      }
  ]
  ```

### 2. Create New Payment

Creates a new payment.

- **URL:** `/api/payments`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **Request Body:**
  ```json
  {
      "proposal_id": "proposal_id",
      "amount": 50000
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_payment_id",
      "...": "other payment details"
  }
  ```

### 3. Get Payment by ID

Retrieves details of a single payment by its ID.

- **URL:** `/api/payments/{id}`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the payment.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "id": "payment_id",
      "...": "other payment details"
  }
  ```

### 4. Update Payment

Updates an existing payment's details.

- **URL:** `/api/payments/{id}`
- **Method:** `PUT`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the payment to update.
- **Request Body:**
  ```json
  {
      "status": "paid"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "payment_id",
      "status": "paid",
      "...": "other payment details"
  }
  ```

## Feedback

### 1. Get All Feedback

Retrieves a list of all feedback.

- **URL:** `/api/feedback`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  * `proposal_id`: (Optional) Filter feedback by proposal ID.
- **Response Body:**
  ```json
  [
      {
          "id": "feedback_id",
          "user_id": "user_id",
          "message": "Feedback message"
      }
  ]
  ```

### 2. Create New Feedback

Creates new feedback.

- **URL:** `/api/feedback`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **Request Body:**
  ```json
  {
      "proposal_id": "proposal_id",
      "message": "New feedback"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_feedback_id",
      "...": "other feedback details"
  }
  ```

## Audit Logs

### 1. Get All Audit Logs

Retrieves a list of all audit logs.

- **URL:** `/api/audit-logs`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Request Body:** None
- **Response Body:**
  ```json
  [
      {
          "id": "log_id",
          "user_id": "user_id",
          "action": "user_login",
          "details": {}
      }
  ]
  ```

## Approval Workflows

### 1. Get Approval Status for a Proposal

Retrieves the approval status for a specific proposal.

- **URL:** `/api/proposals/{proposal_id}/approvals`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `proposal_id`: The ID of the proposal.
- **Request Body:** None
- **Response Body:**
  ```json
  [
      {
          "id": "approval_id",
          "approver_id": "user_id",
          "status": "pending"
      }
  ]
  ```

### 2. Approve or Reject a Proposal

Approves or rejects a proposal.

- **URL:** `/api/proposals/{proposal_id}/approvals`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `proposal_id`: The ID of the proposal.
- **Request Body:**
  ```json
  {
      "status": "approved",
      "notes": "Looks good"
  }
  ```
- **Response Body:**
  ```json
  {
      "id": "new_approval_id",
      "...": "other approval details"
  }
  ```

## Proposal Attachments

### 1. Upload Proposal Attachment

Uploads a new attachment for a specific proposal.

- **URL:** `/api/proposals/{proposal_id}/attachments`
- **Method:** `POST`
- **Headers:**
  * `Content-Type: multipart/form-data`
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `proposal_id`: The ID of the proposal.
- **Request Body:** (multipart/form-data with file)
  ```
  file: [binary file data]
  ```
- **Response Body:**
  ```json
  {
      "id": "attachment_id",
      "file_name": "file.pdf",
      "file_path": "/path/to/file.pdf"
  }
  ```

### 2. Delete Proposal Attachment

Deletes a proposal attachment by its ID.

- **URL:** `/api/attachments/{id}`
- **Method:** `DELETE`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the attachment to delete.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "Attachment deleted"
  }
  ```

## Notifications

### 1. Get User Notifications

Retrieves a list of notifications for the currently authenticated user.

- **URL:** `/api/notifications`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Request Body:** None
- **Response Body:**
  ```json
  [
      {
          "id": "notification_id",
          "message": "New proposal submitted",
          "is_read": false
      }
  ]
  ```

### 2. Mark Notification as Read

Marks a specific notification as read.

- **URL:** `/api/notifications/{id}/read`
- **Method:** `PUT`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **URL Parameters:**
  * `id`: The ID of the notification to mark as read.
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "message": "Notification marked as read"
  }
  ```

## General User Endpoint

### 1. Get Authenticated User Details

Retrieves details of the currently authenticated user. This endpoint is similar to `/api/auth/me`.

- **URL:** `/api/user`
- **Method:** `GET`
- **Headers:**
  * `Authorization: Bearer <your_api_token>`
- **Request Body:** None
- **Response Body:**
  ```json
  {
      "id": "user_id",
      "full_name": "User Name",
      "email": "user@example.com",
      "role": "user_role"
  }
  ```

## How to Access and Use the API

To interact with the API, you will typically use an HTTP client (e.g., Postman, Insomnia, or `curl`).

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

# Kebutuhan Tambahan

- Api di Lapor
- Manajemen User Status tidak ada
  - apkah perlu penambahan field status
  - apkah perlu ada API update status
- RKAM fieldnya sudah ada didatabase, nanti akan dilihat di frontend
- Feedback ini usahakan di join dengan user agar tidak hanya user id yang dipanggil tapi juga, beberapa user fielad yang ada di web, serta tambahkan dengan field response, tambahkan tanggal response
- payment dijoinkan dengan nama proposal
- Response body di payment	sesuaikan dengan yang tampil di web
  - seperti rekening pengusul
  - juga di pengusulu tambahkan rekening yang dia punya

## Reporting

### 1. Get Reporting Summary

Retrieves a summary of reporting data.

- **URL:** `/api/reporting/summary`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  - `start_date` (optional, format: YYYY-MM-DD)
  - `end_date` (optional, format: YYY-MM-DD)
  - `category` (optional)
- **Response Body:**
  ```json
  {
      "totalProposals": 47,
      "approvedProposals": 32,
      "rejectedProposals": 8,
      "pendingProposals": 7,
      "totalBudget": 2400000000,
      "usedBudget": 1800000000,
      "remainingBudget": 600000000
  }
  ```

### 2. Get Monthly Trends

Retrieves data for monthly trends.

- **URL:** `/api/reporting/monthly-trends`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  - `start_date` (optional, format: YYYY-MM-DD)
  - `end_date` (optional, format: YYYY-MM-DD)
  - `category` (optional)
  - `report_type` (optional, values: all, approved, pending, rejected)
- **Response Body:**
  ```json
  [
    { "month": "Jan", "proposals": 12, "budget": 450000000 },
    { "month": "Feb", "proposals": 8, "budget": 320000000 },
    { "month": "Mar", "proposals": 15, "budget": 580000000 },
    { "month": "Apr", "proposals": 10, "budget": 380000000 },
    { "month": "May", "proposals": 2, "budget": 70000000 }
  ]
  ```
- **Example `curl` command:**
  ```bash
  curl -X GET \
    http://127.0.0.1:8000/api/reporting/monthly-trends \
    -H 'Authorization: Bearer <your_api_token>'
  ```

### 3. Get Category Breakdown

Retrieves a breakdown of data by category.

- **URL:** `/api/reporting/category-breakdown`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  - `start_date` (optional, format: YYYY-MM-DD)
  - `end_date` (optional, format: YYYY-MM-DD)
  - `report_type` (optional, values: all, approved, pending, rejected)
- **Response Body:**
  ```json
  [
    { "name": "Infrastruktur", "count": 15, "percentage": 32, "budget": 750000000 },
    { "name": "Pendidikan", "count": 12, "percentage": 26, "budget": 480000000 },
    { "name": "Teknologi", "count": 8, "percentage": 17, "budget": 320000000 },
    { "name": "Pemeliharaan", "count": 7, "percentage": 15, "budget": 280000000 },
    { "name": "Kesehatan", "count": 3, "percentage": 6, "budget": 120000000 },
    { "name": "Lainnya", "count": 2, "percentage": 4, "budget": 80000000 }
  ]
  ```
- **Example `curl` command:**
  ```bash
  curl -X GET \
    http://127.0.0.1:8000/api/reporting/category-breakdown \
    -H 'Authorization: Bearer <your_api_token>'
  ```

### 4. Export Report

Exports a report in the specified format.

- **URL:** `/api/reporting/export`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer <your_api_token>`
- **Query Parameters:**
  - `format` (required, values: pdf, excel)
  - `start_date` (optional, format: YYYY-MM-DD)
  - `end_date` (optional, format: YYYY-MM-DD)
  - `report_type` (optional, values: all, approved, pending, rejected)
  - `category` (optional)
- **Response:**
  - A file download of the report.
- **Example `curl` command:**
  ```bash
  curl -X GET \
    http://127.0.0.1:8000/api/reporting/export?format=pdf \
    -H 'Authorization: Bearer <your_api_token>'
  ```
