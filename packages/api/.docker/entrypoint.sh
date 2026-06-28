#!/bin/sh
set -e

role="${ROLE:-api}"

case "$role" in
    api)
        php artisan migrate --force || true
        php artisan optimize || true
        php artisan storage:link || true
        php artisan queue:restart || true
        php-fpm -D
        exec nginx -g 'daemon off;'
        ;;
    queue)
        exec php artisan queue:work redis --tries=3 --max-time=3600 --sleep=3
        ;;
    scheduler)
        while true; do
            php artisan schedule:run --no-interaction --verbose
            sleep 60
        done
        ;;
    reverb)
        exec php artisan reverb:start --daemon
        ;;
    *)
        echo "Unknown ROLE: $role" >&2
        exit 1
        ;;
esac