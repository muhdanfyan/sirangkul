# SiRangkul Production Stability Guardian

> **Purpose**: Agentic skill for diagnosing, preventing, and remediating production issues on the SiRangkul VPS. This skill encodes hard-won lessons from real production incidents.

---

## 🏗 VPS Infrastructure Reference

| Item | Value |
|---|---|
| **Host** | `89.233.105.92` |
| **SSH User** | `sirangkul` |
| **OS** | Ubuntu 24.04.1 LTS |
| **Web Server** | Nginx 1.24.0 (reverse proxy) → Apache (PHP handler) |
| **App Path** | `/home/sirangkul/apps/sirangkul` |
| **API Path** | `/home/sirangkul/apps/sirangkul/api-sirangkul` |
| **Frontend** | Vite (pre-built `dist/` served by Nginx) |
| **Database** | MySQL/MariaDB, DB name: `sirangkul` |
| **Domain** | `sirangkul.man2kotamakassar.sch.id` |
| **SSL** | HTTPS with HSTS enabled |

### Deploy Scripts (in project root)

| Script | Purpose |
|---|---|
| `deploy_file.exp` | SCP a single file to VPS (`expect deploy_file.exp <local> <remote>`) |
| `check_logs.exp` | SSH in, run migration, clear cache |
| `deploy_dist.exp` | Upload built frontend |

---

## 🔴 Known Production Incident Patterns

### Incident 1: Session UUID Truncation (2026-04-16)

**Symptom**: All authenticated API requests return `500 Internal Server Error`.

**Root Cause**: The `sessions` table `user_id` column was `bigint(20) unsigned` (Laravel default), but SiRangkul uses UUID strings (e.g., `2be97f7d-f0c7-45be-ad23-b1070ce96958`) for user IDs. MySQL silently truncated the UUID, throwing `SQLSTATE[01000]: Warning: 1265 Data truncated for column 'user_id'`.

**Detection Pattern**:
```bash
# Look for this in laravel.log:
grep 'Data truncated for column' storage/logs/laravel.log
```

**Fix Applied**: Migration `2026_04_16_075700_modify_user_id_in_sessions_table.php`
```php
Schema::table('sessions', function (Blueprint $table) {
    $table->string('user_id', 36)->nullable()->change();
});
```

**Prevention Rule**: 
> ⚠️ When a Laravel project uses UUIDs for user IDs (`HasUuids` trait or `$table->uuid('id')`), ALL tables that reference `user_id` MUST use `string/varchar(36)` instead of `unsignedBigInteger`. Check these tables:
> - `sessions`
> - `personal_access_tokens` 
> - `notifications`
> - `audit_logs`
> - Any table with `foreignId('user_id')`

### Incident 2: apiResource Wildcard Route Conflict (2026-04-16)

**Symptom**: `GET /api/rkam/options` returns `404 {"success":false,"message":"RKAM not found"}` — the `show()` method fires instead of `getOptions()`.

**Root Cause**: `Route::apiResource('rkam', RkamController::class)` in `web.php` generates `rkam/{rkam}` which matches "options" as a route parameter before the explicit `Route::get('/rkam/options', ...)` can match.

**Detection Pattern**:
```bash
# Check if apiResource is registered alongside explicit sub-routes:
grep -n 'apiResource.*rkam' routes/web.php routes/api.php
grep -n "rkam/options\|rkam/available\|rkam/kategori" routes/web.php routes/api.php
# If both exist → CONFLICT
```

**Fix Applied**: Replaced `apiResource('rkam')` in `web.php` with explicit routes:
```php
// RKAM Routes - explicit to ensure /options is matched before /{id}
Route::get('/rkam', [RkamController::class, 'index']);
Route::get('/rkam/options', [RkamController::class, 'getOptions']);
Route::post('/rkam', [RkamController::class, 'store']);
Route::get('/rkam/{id}', [RkamController::class, 'show']);
Route::put('/rkam/{id}', [RkamController::class, 'update']);
Route::delete('/rkam/{id}', [RkamController::class, 'destroy']);
```

**Prevention Rule**:
> ⚠️ NEVER use `apiResource()` when you also need custom sub-routes like `/options`, `/available/list`, `/statistics`. Always use explicit route definitions and place specific string routes BEFORE wildcard `{id}` routes.

### Incident 3: 404 Not Found on API Login (2026-04-17)

**Symptom**: `POST /api/auth/login` returns `404 Not Found`. Laravel log shows `The route auth/login could not be found.`

**Root Cause**: Conflict between Nginx's `/api` alias and Laravel 11's default `api/` prefix for routes in `api.php`. When served via a subfolder alias, Laravel detects `/api` as its base path and strips it from the incoming URI. This results in the router seeing `auth/login`, which fails to match the expected `api/auth/login`.

**Detection Pattern**:
```bash
# Check if a double prefix works:
curl -X POST https://sirangkul.man2kotamakassar.sch.id/api/api/auth/login
# If this returns 401 instead of 404 -> PREFIX CONFLICT
```

**Fix Applied**:
1. Updated `bootstrap/app.php` to remove the default API prefix:
```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: '', // Removed 'api' prefix
    ...
)
```
2. Standardized Nginx rewrite:
```nginx
rewrite ^/api/(.*)$ /api/index.php?$query_string last;
```

**Prevention Rule**:
> ⚠️ When serving Laravel 11 under an Nginx subfolder alias (e.g., `/api`), ALWAYS set `apiPrefix: ''` in `bootstrap/app.php`. This allows the environment-provided prefix to match the routes without duplication or stripping conflicts.

---

## 🛡 Pre-Deployment Checklist

Before ANY deployment to VPS, run through this checklist:

### 1. Schema Compatibility Audit
```bash
# SSH into VPS and check for type mismatches
php artisan tinker --execute="print_r(DB::select('DESCRIBE sessions'))"
php artisan tinker --execute="print_r(DB::select('DESCRIBE users'))"
# Verify user_id columns are varchar(36) not bigint
```

### 2. Route Conflict Audit
```bash
# On VPS after deploy:
php artisan route:list --path=rkam
php artisan route:list --path=proposals
# Look for: wildcard {param} routes appearing BEFORE explicit sub-routes
# Bad:  rkam/{rkam} appearing before rkam/options
# Good: rkam/options appearing before rkam/{id}
```

### 3. Post-Deploy Verification
```bash
# Always run after deploying code:
php artisan optimize:clear
php artisan migrate --force

# Test critical endpoints:
curl -sk -w '%{http_code}' https://sirangkul.man2kotamakassar.sch.id/api/rkam \
  -H 'Accept: application/json' -H 'Authorization: Bearer <TOKEN>'
curl -sk -w '%{http_code}' https://sirangkul.man2kotamakassar.sch.id/api/rkam/options \
  -H 'Accept: application/json' -H 'Authorization: Bearer <TOKEN>'
```

### 4. Log Health Check
```bash
# Check for new errors after deployment:
tail -n 50 storage/logs/laravel.log | grep 'production.ERROR'
# Should return ZERO results after a clean deploy
```

---

## 🔧 Emergency Diagnostic Procedure

When a 500 error is reported:

1. **Check logs FIRST** — Don't guess:
   ```bash
   tail -n 100 /home/sirangkul/apps/sirangkul/api-sirangkul/storage/logs/laravel.log | grep 'ERROR'
   ```

2. **Categorize the error**:
   | Error Pattern | Likely Cause | Quick Fix |
   |---|---|---|
   | `Data truncated for column 'user_id'` | UUID vs bigint mismatch | Migrate column to `varchar(36)` |
   | `RKAM not found` on `/options` | Route wildcard conflict | Replace `apiResource` with explicit routes |
   | `419 Page Expired` | CSRF token mismatch | Ensure API routes bypass `VerifyCsrfToken` |
   | `Class not found` | Missing controller/model | Run `composer dump-autoload` |
   | `Table not found` | Missing migration | Run `php artisan migrate --force` |

3. **Deploy fix via expect scripts**:
   ```bash
   # Upload single file:
   expect deploy_file.exp <local_path> <remote_path>
   
   # Run migration + clear cache:
   expect check_logs.exp
   ```

4. **Verify fix**:
   ```bash
   # Check for zero new errors:
   grep 'production.ERROR' storage/logs/laravel.log | tail -3
   ```

---

## 📋 Current Verified Working State (2026-04-16)

### Sessions Table Schema
```
id          → varchar(255) PRI
user_id     → varchar(36) nullable  ← FIXED from bigint
ip_address  → varchar(45) nullable
user_agent  → text nullable
payload     → longtext
last_activity → int(11)
```

### RKAM Table Schema
```
id             → char(36) PRI (UUID)
parent_id      → char(36) nullable
category_id    → char(36) nullable
kategori       → varchar(255)
item_name      → varchar(255)
pagu           → decimal(15,2)
volume         → varchar(255)
satuan         → varchar(255)
unit_price     → decimal(15,2) default 0.00
dana_bos       → decimal(15,2) default 0.00
dana_komite    → decimal(15,2) default 0.00
description    → text nullable
tahun_anggaran → int(11) default 2026
sort_order     → int(11) default 0
deskripsi      → text nullable
created_at     → timestamp
updated_at     → timestamp nullable
```

### Verified API Endpoints
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/rkam` | GET | Bearer | ✅ 200 |
| `/api/rkam/options` | GET | Bearer | ✅ 200 |
| `/api/rkam/{id}` | GET | Bearer | ✅ 200 |
| `/api/public/rkam` | GET | None | ✅ 200 |
| `/api/public/rkam/options` | GET | None | ✅ 200 |
| `/api/auth/login` | POST | None | ✅ 200 |
| `/api/auth/me` | GET | Bearer | ✅ 200 |

### RKAM Data Stats
- **Total Records**: 368
- **Categories**: Loaded from `categories` table
- **Units**: Dynamic from distinct `satuan` values

---

## ⚙️ Dual Route Group Architecture

SiRangkul uses a **dual route group** architecture due to Nginx configuration:

- **`routes/api.php`** — Standard Laravel API routes (prefixed with `/api/` by framework)
- **`routes/web.php`** — Also handles API routes because Nginx proxies `/api/*` to the Laravel app root

> ⚠️ **CRITICAL**: Both files register overlapping routes. When modifying routes, you MUST update BOTH `api.php` AND `web.php` to maintain consistency. A fix in one file without the other will result in intermittent failures depending on which route group matches first.

### Route Sync Checklist
When adding/modifying RKAM or Proposal routes:
1. Update `api.php` (primary)
2. Update `web.php` (Nginx proxy mirror)
3. Deploy both files to VPS
4. Run `php artisan optimize:clear`
5. Verify with `php artisan route:list --path=<resource>`
