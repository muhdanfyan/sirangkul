---
name: database-ops
description: Management of the production MySQL/MariaDB database, schema migrations, and data auditing procedures.
origin: project
---

# Database Operations: SiRangkul

This skill manages the structural and data integrity of the SiRangkul persistent storage layer.

## 1. Schema Management
We strictly follow Laravel migration patterns. All production schema changes must be deployed via:
- `vps_migrate_status.exp`: To check pending migrations.
- `vps_migrate_retry.exp`: To execute migrations with automated error handling.

### Naming Conventions & Drift Prevention
- **Table Names**: Core table is **`rkams`** (Plural). Avoid `rkam` (Singular) in code logic/SQL.
- **Model Enforcement**: `App\Models\Rkam.php` MUST have `protected $table = 'rkams';`.
- **Mandatory Columns**: Ensure `bidang`, `bidang_id`, `sort_order`, and `description` are present in `rkams` and `proposals`.
- **Manual Normalization**: If migrations fail to apply, use `vps_cmd.exp` to manually add columns using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

## 2. Recovery & Backup
- **Manual Dumps**: `dump_schema.exp` creates a local SQL dump of the production database for offline analysis.
- **Upload/Restore**: `vps_upload_sql.exp` allows uploading local SQL snapshots to the server for recovery or environment synchronization.

## 3. Data Auditing & Loss Prevention
- **Zero-Row Alert**: If `rkams` or `proposals` count returns **0** on production, it is considered a **CRITICAL INCIDENT**. Restore from backup immediately.
- **Pre-Migration Audit**: Record counts of `rkams`, `proposals`, and `users` BEFORE running any seeder or migration.

| Script | Purpose |
| :--- | :--- |
| `vps_db_counts.exp` | Returns row counts. **Note**: Update this script to use `rkams` if it still points to `rkam`. |
| `vps_check_vps_schema.exp` | Verifies foreign key constraints. |
| `vps_check_laravel_logs.exp` | Look for "Integrity constraint violation" or "SQL State" errors. |

## 4. Key Constraints & Rules
- **UUID Compliance**: All migrations MUST use `uuid('id')->primary()` and `foreignUuid('user_id')` or `varchar(36)`.
- **Relational Integrity**: As documented in the architecture skill, `ON DELETE CASCADE` is forbidden for financial data.
- **Strict Mode**: Ensure SQL Strict Mode is correctly handled in queries, particularly for `GROUP BY` operations in `ReportingController`.

## 5. Security
- Database credentials should only be accessed via the secure `vps_cat_env.exp` script or via `get_db_pass.exp`.
- Never expose the DB port `3306` to public IPs; always interact via internal SSH tunnels using the `vps_tools` harness.
