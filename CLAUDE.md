# SiRangkul API Project Guidelines

Standardized documentation following the [Everything-Claude-Code](https://github.com/affaan-m/everything-claude-code) system.

## Project Vision
Integrated reporting and RKAM (Rencana Kerja dan Anggaran Madrasah) management system for Madrasah.

## Tech Stack
- **Environment**: PHP 8.3+, Nginx
- **Framework**: Laravel 11.x
- **Database**: MySQL (with UUIDs as primary keys)
- **Authentication**: Laravel Sanctum (Token-based)
- **Frontend Integration**: Dedicated Vite/React frontend (served separately)

## Core Commands
- **Local Development**: `./dev.sh` (runs artisan serve and other watchers)
- **Tests**: `php artisan test`
- **Route Debugging**: `php artisan route:list`
- **Deployment**: Handled via `vps_tools/` scripts (e.g., `vps_deploy.exp`)

## Code Conventions
- **Routing**: API routes MUST be mirrored in `routes/api.php` and `routes/web.php` for Nginx subfolder alias compatibility.
- **Data Integrity**: All `user_id` foreign keys MUST be `varchar(36)` to support UUIDs.
- **Patterns**: Prefer `apiResource` but ensure specific sub-routes (like `/options`) are declared **BEFORE** the resource route.
- **Prefixes**: The application serves its API under the `/api` prefix. Use empty `apiPrefix` in `bootstrap/app.php` and manually prefix routes to handle proxying correctly.

## Project Structure
- `api-sirangkul/`: Main Laravel application source.
- `vps_tools/`: Automation scripts for deployment and server management.
- `.agents/skills/`: Hierarchical domain knowledge:
    - `system-architecture/`: Global overview and DB schema.
    - `verification-loop/`: TDD and E2E testing harness.
    - `deployment-operations/`: VPS sync and deploy patterns.
    - `server-auditing/`: Health checks and logs.
    - `database-ops/`: Schema and migration management.
    - `incident-mitigation/`: Error registry and resolution playbooks.
    - `ui-ux-consistency/`: Frontend integration standards.
    - `production-stability-guardian/`: Cumulative stability history.
