# Project Rules & Constraints

## Critical Safeguards
- **Nginx Alias Compatibility**: All API routes MUST be registered in both `routes/api.php` and `routes/web.php`. Failure to do so causes 404/405 errors on the VPS due to how the `/api` alias is handled.
- **UUID Data Types**: Never use `unsignedBigInteger` or `foreignId` for columns referencing `users.id`. Use `varchar(36)` or `foreignUuid`.
- **Route Ordering**: Always place static/specific routes (e.g., `/available`, `/options`) **above** wildcard routes (e.g., `/{id}`, `apiResource`) to prevent parameter shadowing.

## API Consistency
- All responses should follow a consistent JSON structure.
- Use Laravel API Resources for transforming models.
- Throttle authentication endpoints (`auth/login`) to prevent brute force.

## Deployment
- Never deploy to production without running `php artisan route:list` to check for overlapping paths.
- All technical knowledge and learned patterns must be documented in the corresponding `.agents/skills/` module.
- Always consult the `incident-mitigation` skill before attempting manual server fixes.
- Verification must follow the `verification-loop` playbook.
