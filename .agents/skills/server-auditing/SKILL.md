---
name: server-auditing
description: Routine health checks, status verification, and log auditing procedures for the SiRangkul production server.
origin: project
---

# Server Auditing: SiRangkul

This skill provides the mechanisms for verifying that the production environment is stable and responding correctly after updates or during routine maintenance.

## 1. Automated Health Checks
We use specialized Expect scripts in `vps_tools/` to perform synthetic transactions and status checks:

| Script | Purpose |
| :--- | :--- |
| `health_check_vps.exp` | Checks core API endpoints (Reporting, RKAM) and Frontend routes. |
| `vps_verify_up.exp` | Basic connectivity and Nginx response check. |
| `check_vps_status.exp` | High-level overview of running services (Nginx, FPM, MySQL). |
| `vps_check_laravel_logs.exp` | Tails the `storage/logs/laravel.log` and filters for high-severity errors. |
| `vps_route_list_full.exp` | Runs `php artisan route:list` on-server to verify prefixing. |

## 2. Infrastructure Verification Logic
- **API Connectivity**: Verify `http://localhost:8000/api/health` returns `200 OK`.
- **SQL Integrity**: Verify `api/reporting/monthly-trends` returns data without 500 errors (Validates SQL Strict Mode compliance).
- **Frontend Mapping**: Verify root `/` and subpaths like `/reports` are served with `200 OK` via Nginx `try_files`.
- **SSL Status**: Use `check_vps_ssl.exp` to verify Certbot certificate validity.

## 3. Log Inspection
When an anomaly is detected, use the following audit workflow:
1. **Nginx Logs**: `vps_cat_nginx.exp` (Access and Error logs).
2. **Laravel Logs**: `vps_check_laravel_logs.exp` (Exception traces).
3. **FPM Logs**: Inspect `/var/log/php8.3-fpm.log` for process starvation (SSRK-02).

## 4. Environment Verification
Always verify that the `.env` on production matches the expected configuration using `vps_cat_env.exp`. Pay close attention to:
- `APP_URL`: Must correctly reflect the production domain.
- `DB_DATABASE`: Ensure it targets the live school data.
- `SANCTUM_STATEFUL_DOMAINS`: Keep empty to avoid CSRF deadlocks (SSRK-01).
