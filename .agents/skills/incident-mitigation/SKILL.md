---
name: incident-mitigation
description: Registry of known production incidents, root cause analyses, and standardized resolution procedures for the SiRangkul environment.
origin: project
---

# Incident Mitigation: SiRangkul

This skill documents historical incidents and provides standard operating procedures (SOPs) to prevent recurrence.

## 1. The "Empty RKAM" Trap (2026-05-06)
**Issue**: Data in `rkams` and `proposals` tables disappears after running migrations/seeders.
**Root Cause**: 
1. `RkamSeeder` and `ProposalSeeder` start with `delete()` operations.
2. Seeders depend on a local Markdown file (`docs/RKAM_2026.md`) which may be missing on the VPS.
3. If the file is missing, seeders exit early AFTER deleting existing data.
**Mitigation**:
- **NEVER** run seeders on production unless the source file existence is verified: `ls /home/sirangkul/apps/sirangkul/docs/RKAM_2026.md`.
- **MANDATORY BACKUP**: Run `./vps_tools/dump_schema.exp` (or full dump) before ANY migration.

## 2. Table Naming Inconsistency (`rkam` vs `rkams`)
**Issue**: Application 500 error due to "Table not found".
**Context**: 
- Local/Migration code often uses singular `rkam`.
- Production database uses plural `rkams`.
- `database-ops` skill mandates `rkams`.
**Mitigation**:
- **Model Enforcement**: Ensure `App\Models\Rkam.php` always has `protected $table = 'rkams';`.
- **Migration Audit**: Check all new migrations for `Schema::hasTable('rkams')` before assuming singular `rkam`.

## 3. Unauthorized (401) After Deployment
**Issue**: Users kicked out after sync/restore.
**Root Cause**: Cache clearing and session table truncation.
**Mitigation**:
- Inform users beforehand that a re-login will be required.
- Do not clear `sessions` table unless absolutely necessary for schema changes.

## 4. Subfolder Routing (404)
**Issue**: API endpoints return 404.
**Root Cause**: `apiPrefix` in `bootstrap/app.php` mismatch with Nginx stripping `/api`.
**Mitigation**: 
- Refer to `vps-subfolder-routing` skill.
- Keep `apiPrefix: ''` in `bootstrap/app.php` for production.
