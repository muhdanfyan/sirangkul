---
name: verification-loop
description: Comprehensive verification strategy for SiRangkul, including E2E simulation, RBAC validation, and production safety gates.
origin: project
---

# Verification Loop: SiRangkul

This skill defines the mandatory safety gates that MUST be checked during and after every deployment or database operation.

## 1. Pre-Execution Safety Gates (BEFORE Deploy/Migrate)
Before running any destructive command (migration, sync, seeder):
1. **Full Backup**: Create a timestamped SQL dump.
2. **Current State Audit**: Record row counts for `users`, `proposals`, and `rkams`.
3. **Source Verification**: If seeding, verify the source file exists: `ls docs/RKAM_2026.md`.

## 2. Post-Execution Verification (AFTER Deploy/Migrate)
Immediately after completion, run the following checks:

### A. Connectivity & Routing
- Run `curl -I https://sirangkul.man2kotamakassar.sch.id/api/up` -> Must be **200 OK**.
- Run `curl -s https://sirangkul.man2kotamakassar.sch.id/api/` -> Must return `SiRangkul API is running` (API Group).

### B. Data Integrity
- Check row counts again. Compare with Pre-Execution Audit.
- If row counts for `rkams` or `proposals` are **0**, trigger **IMMEDIATE RESTORE** from backup.

### C. Authentication (The 401/404 Check)
- Attempt a mock login using `curl` with the Superadmin credentials.
- Expect **200** with a Token. If **404**, check `bootstrap/app.php` prefix. If **401**, ensure user wasn't deleted.

## 3. Automated Verification Script
Use the following command pattern to check system health:
```bash
./vps_tools/vps_cmd.exp "cd /home/sirangkul/apps/sirangkul/api-sirangkul && php artisan tinker --execute=\"echo 'RKAM: ' . \App\Models\Rkam::count(); echo ' Proposals: ' . \App\Models\Proposal::count();\""
```

## 4. Safety First Rule
If ANY verification step fails, the agent MUST stop and report to the user immediately, explaining the risk and the rollback plan.
