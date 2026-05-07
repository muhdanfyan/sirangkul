---
name: vps-subfolder-routing
description: Management of Laravel routing and Nginx aliasing for subfolder-based API deployments.
origin: project
---

# VPS Subfolder Routing: SiRangkul

This skill documents the critical configuration required to run the Laravel API within the `/api` subfolder on the production VPS.

## 1. Nginx Configuration Pattern
The API is served via an `alias` directive in Nginx. Because Nginx strips the prefix when using `alias`, special handling is required.

### Nginx Block (`/etc/nginx/sites-enabled/sirangkul`)
```nginx
location /api {
    alias /home/sirangkul/apps/sirangkul/api-sirangkul/public;
    index index.php;
    
    # Try finding the file in the alias path first, fallback to @larapi
    try_files $uri $uri/ @larapi;

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }
}

# Standard Laravel Fallback
location @larapi {
    rewrite /api/(.*)$ /api/index.php last;
}
```

## 2. Laravel Routing Configuration
Since Nginx strips the `/api` prefix, Laravel receives requests starting directly with the internal path (e.g., `auth/login`).

### Bootstrap Configuration (`bootstrap/app.php`)
The `apiPrefix` must be set to an empty string to match the stripped path provided by Nginx.

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', 
        apiPrefix: '', // CRITICAL: Must be empty if Nginx strips /api
        ...
    )
```

## 3. Common Issues & Debugging
- **404 Not Found**: Usually caused by `apiPrefix: 'api'` in `bootstrap/app.php` while Nginx is stripping the prefix.
- **500 Internal Server Error**: Check `storage/logs/laravel.log`. Common cause is a mismatch between the `Model::$table` property and the actual database schema (e.g., `rkam` vs `rkams`).
- **Permission Denied**: Run `vps_fix_perms_fast.exp` to reset ownership to `sirangkul:www-data`.

## 4. Verification
Always verify the following endpoints after deployment:
1. `GET /api/` -> Should return `SiRangkul API is running` (API Group).
2. `GET /api/up` -> Should return the Laravel health status.
3. `POST /api/auth/login` -> Should return 200/401, not 404.
