# Safeguard & Mitigation Matrix

This document ensures that every failure encountered today has a permanent, documented, and automated counter-measure.

| Failure / Issue | Root Cause | Permanent Skill (Protocol) | Automated Guard (Tool) |
| :--- | :--- | :--- | :--- |
| **500 SQL Strict Mode Error** | Aggregate-unsafe queries | [SQL Strict Mode Protocol](./skill_sql_strict_mode.md) | `vps_tools/health_check_vps.exp` |
| **ReferenceError (Prod Crash)** | Using `setSummary` without `useState` | [Component Integrity Check](./skill_component_integrity.md) | Local `npm run build` pre-sync |
| **Git Auth Wall / "Ngasal" Sync** | Denied access on VPS led to shortcuts | **Rsync First Policy** | `vps_tools/sync_backend_direct.exp` |
| **Non-Dynamic Budget Summary** | Restricted totals by active filters | **Global Query Standard** | VPS Tinker Audit Check |
| **UI Data/Color Mismatch** | Ad-hoc styling for BOS/Komite | [Design Consistency Standard](./skill_design_consistency.md) | Visual Token Audit |

## Technical Reconciliation Log

### 1. SQL Compatibility (Status: FIXED)
- **Issue**: `monthly-trends` failed in strict mode.
- **Guard**: All future trends/analytics MUST use `orderByRaw` for aggregated results.
- **Check**: The `health_check_vps.exp` now specifically pings the `/api/reporting/monthly-trends` endpoint.

### 2. State Integrity (Status: FIXED)
- **Issue**: RKAM pages crashed due to missing `summary` state.
- **Guard**: Mandatory grep for setters against state declarations before push.
- **Check**: Local builds are now enforced in the sync script to catch compile-time errors.

### 3. Sync Reliability (Status: FIXED)
- **Issue**: Manual swapping of files led to branch desync.
- **Guard**: All deployments now use `vps_tools/sync_backend_direct.exp` which mirrors the *entire* backend via `rsync`.
- **Check**: Automated `php artisan optimize:clear` is now part of the sync chain.

### 4. Transparency Accuracy (Status: FIXED)
- **Issue**: Public summary showed incorrect, filtered totals.
- **Guard**: Use fresh Eloquent instances (ignoring active filters) for global school trackers.
- **Check**: Manual audit via VPS Tinker showed $5.14B$ Pagu.
