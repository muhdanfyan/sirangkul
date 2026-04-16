#!/bin/bash
set -e

# Configuration variables
DOMAIN="sirangkul.man2kotamakassar.sch.id"
WORK_DIR="/home/sirangkul/apps/sirangkul"
PHP_FPM_SOCK="/var/run/php/php8.3-fpm.sock"

echo "Creating API symlink for easier Nginx routing..."
sudo ln -sf $WORK_DIR/api-sirangkul/public $WORK_DIR/api-sirangkul/api

echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/sirangkul <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Frontend
    location / {
        root $WORK_DIR/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API
    location /api {
        root $WORK_DIR/api-sirangkul;
        index index.php;
        try_files \$uri \$uri/ /api/index.php?\$query_string;

        location ~ \.php\$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:$PHP_FPM_SOCK;
            fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
            include fastcgi_params;
        }
    }
}
EOF

echo "Enabling site and restarting services..."
sudo ln -sf /etc/nginx/sites-available/sirangkul /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Setting up Backend (.env)..."
cd $WORK_DIR/api-sirangkul
if [ ! -f .env ]; then
    cp .env.example .env
fi
php artisan key:generate --force

# Ensure correct DB settings
sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
sed -i 's/DB_HOST=.*/DB_HOST=127.0.0.1/' .env
sed -i 's/DB_DATABASE=.*/DB_DATABASE=sirangkul/' .env
sed -i 's/DB_USERNAME=.*/DB_USERNAME=sirangkul/' .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=jUSlAmnIagcSUz4/' .env

echo "Installing Backend dependencies (if needed)..."
# Force install of composer if missing in the PATH or use global
composer install --no-dev --optimize-autoloader || php /usr/local/bin/composer install --no-dev --optimize-autoloader

echo "Final Permission Sync..."
sudo chown -R sirangkul:www-data $WORK_DIR
sudo chmod -R 775 $WORK_DIR/api-sirangkul/storage
sudo chmod -R 775 $WORK_DIR/api-sirangkul/bootstrap/cache

echo "Configuration completed!"
