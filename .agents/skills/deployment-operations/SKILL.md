---
name: deployment-operations
description: Production deployment procedures, file synchronization, and hotfix application workflow for the SiRangkul environment.
origin: project
---

# Deployment Operations: SiRangkul

This skill manages the transition of code and assets from the local development environment to the production VPS.

## 1. Primary Deployment Scripts
Stored in `vps_tools/`, these automated Expect scripts handle authentication and execution:

| Script | Purpose |
| :--- | :--- |
| `vps_final_deploy.exp` | Full application deployment (Backend + Frontend). |
| `vps_apply_fixes.exp` | Targeted hotfix deployment (Nginx configs, bootstrap fixes). |
| `vps_ultimate_sync.exp` | High-speed synchronization of the entire application state. |
| `deploy_dist.exp` | Uploads the compiled frontend `dist/` folder to Nginx. |
| `vps_upload_sql.exp` | Migrates database dumps to the production environment. |

## 2. Standard Deployment Workflow
1. **Build Locally**: `npm run build` (if frontend changes).
2. **Pre-flight Check**: Run `php artisan test` and `route:list`.
3. **Execute Sync**: `./vps_tools/vps_ultimate_sync.exp` (requires `Sfgxjs4H38DQb7K` password).
4. **Permissions Fix**: Run `vps_fix_perms_fast.exp` to ensure `storage/` and `bootstrap/cache` are writable by `www-data`.
5. **Reload Services**: `sudo systemctl reload nginx && sudo systemctl restart php8.3-fpm`.

## 3. Remote Server Coordinates
- **User**: `sirangkul`
- **Host**: `89.233.105.92`
- **Application Path**: `/home/sirangkul/apps/sirangkul/`
- **Webroot**: `/home/sirangkul/apps/sirangkul/dist` (Frontend)
- **API Root**: `/home/sirangkul/apps/sirangkul/api-sirangkul` (Backend)

> [!CAUTION]
> **Git Protection**: Never run `git push` directly to the production branch without verifying the local build first. Always use the deployment scripts to ensure permissions are preserved.
