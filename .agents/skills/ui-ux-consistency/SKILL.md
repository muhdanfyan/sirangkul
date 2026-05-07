---
name: ui-ux-consistency
description: Standards for frontend-backend integration, API communication contracts, and UI aesthetic guidelines.
origin: project
---

# UI/UX Consistency: SiRangkul

This skill defines the integration contract between the React frontend and the Laravel backend to ensure a seamless and professional user experience.

## 1. API Communication Contract
All frontend components must use a centralized Axios instance (`/src/services/api.ts`) with the following defaults:

- **Base URL**: Set to `/api` (handles environment-specific proxying).
- **Headers**: 
    - `Accept: application/json`
    - `Content-Type: application/json` (or `multipart/form-data` for uploads).
- **Authentication**: JWT Bearer token must be included in the `Authorization` header for all protected routes.
- **Global Error Handling**: 
    - **401 Unauthorized**: Redirect to `/login` and clear client session.
    - **422 Validation Error**: Map backend `errors` object to specific UI form fields.
    - **403 Forbidden**: Show "Access Denied" view; do not attempt the request if the local `role` does not match the route's requirements.

## 2. Component Integration Matrix
| Module | Components | API Trigger | Logic |
| :--- | :--- | :--- | :--- |
| **Auth** | `LoginPage`, `HeaderNav` | `/api/auth/login`, `/me`, `/logout` | LocalStorage persistence & status synchronization. |
| **RKAM** | `RkamTable`, `RkamModal` | `/api/rkam` (GET/POST) | Budget pot creation & viewer access. |
| **Proposals** | `ProposalForm`, `AttachmentList` | `/api/proposals` | Multipart form submission for PDF files. |
| **Workflow** | `ApprovalButtons`, `HistoryList` | `/api/proposals/{id}/approve` | Multistage status updates (Decision + Notes). |
| **Payments** | `TreasurerDashboard` | `/api/payments` | Proof of payment upload and funding finalization. |

## 3. UI Aesthetic Standards
SiRangkul follows a **Premium/Rich Aesthetic** designed for professional school administration.

- **Visual Style**: Glassmorphism, soft drop-shadows, and a modern, high-contrast palette (Avoid generic CSS defaults).
- **Interactivity**: 
    - **Loading States**: Mandatory `Skeleton` loaders for tables/forms.
    - **Safe-Guarded Buttons**: Spinners on action buttons to prevent fatal double-clicks on API endpoints.
    - **Feedback**: Immediate `Toast` notifications for long-running operations.
- **Data Display**: Server-side pagination is required for index views to maintain performance.

## 4. Route Guards (`PrivateRoute`)
All routes except `/login` are protected. The application must perform a "Zero-Trust" check:
1. Verify if the user has a token.
2. Verify if the user's `role` is permitted to see the component.
3. If either fails, show `403 Forbidden` or redirect to `/login`.
