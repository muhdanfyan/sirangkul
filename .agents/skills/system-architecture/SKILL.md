---
name: system-architecture
description: Global overview of the SiRangkul system architecture, platform components, data flows, and database schema.
origin: project
---

# System Architecture: SiRangkul

SiRangkul (Sistem Informasi Anggaran dan Keuangan Madrasah) is an integrated reporting and RKAM management system designed for Madrasah environments.

## 1. Architectural Overview
The system follows a decoupled monorepo-style architecture where the frontend and backend are served as separate entities but reside in the same physical environment.

- **Frontend**: React (Vite, TypeScript, Tailwind CSS).
- **Backend API**: PHP Laravel 11.x (Stateless, Sanctum-powered).
- **Communication**: RESTful API calls with Bearer Token authentication.
- **Topology**: Ubuntu VPS (Nginx) serving the frontend via the root `/` and the backend via the `/api` alias.

## 2. Core Platforms

### 2.1 Management Panel (Frontend)
- **Role**: Primary user interface for all roles (Admin, Pengusul, Verifikator, etc.).
- **URL Strategy**: `sirangkul.man2kotamakassar.sch.id`.
- **Auth**: Stateless interactions using Sanctum tokens stored in client-side state.

### 2.2 Core API Service (Backend)
- **Role**: Single Source of Truth for business logic, data persistence, and security.
- **URL Strategy**: `sirangkul.man2kotamakassar.sch.id/api`.
- **Middleware**: Custom security and role-checking middleware.

## 3. Business Data Workflow
1. **Planning**: RKAM (Budget Plan) defined by Administrators.
2. **Submission**: Proposals created by "Pengusul" linked to specific RKAM items.
3. **Verification**: Multi-stage review (Verifikator -> Komite -> Kepala Madrasah).
4. **Execution**: Bendahara (Treasurer) records payments and uploads proofs.
5. **Auditing**: Automatic tracking of all status changes and financial aggregates.

## 4. Database Schema Design
All primary keys and foreign keys for users are **UUID-based** (`varchar(36)`) for enhanced portability and security.

### Core Entities
| Entity | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | Identity management | `id`, `role`, `status` |
| `rkam` | Annual budget pots | `kode_rkam`, `pagu_anggaran`, `tahun_anggaran` |
| `proposals` | Central transactional unit | `pengusul_id`, `rkam_id`, `total_anggaran`, `status` |
| `approval_workflows` | Chronological audit trail | `proposal_id`, `user_id`, `action`, `notes` |
| `payments` | Financial execution | `proposal_id`, `jumlah_dibayar`, `bukti_transaksi_path` |

> [!IMPORTANT]
> **Relational Integrity**: `Cascade On Delete` is strictly forbidden for transactional tables (`proposals`, `rkam`, `payments`) to maintain a legally compliant audit trail. Use `Restore/Restrict` constraint logic.

## 5. Security Model
- **RBAC**: Six distinct authorization levels: `administrator`, `pengusul`, `verifikator`, `kepala_madrasah`, `bendahara`, `komite_madrasah`.
- **Transport**: HTTPS (HSTS) enforced. No raw HTTP endpoints allowed in production.
- **Audit Logs**: Every critical mutation is recorded in the `audit_logs` table (Who, What, When).
