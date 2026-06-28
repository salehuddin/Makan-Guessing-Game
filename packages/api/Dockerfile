FROM php:8.4-fpm-alpine

ARG APP_ENV=production

WORKDIR /var/www/html

RUN apk add --no-cache \
        nginx \
        libpq \
        postgresql-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libwebp-dev \
        libxml2-dev \
        oniguruma-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql pgsql \
        gd exif \
        zip \
        bcmath opcache \
        pcntl \
    && pecl install redis && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-dev --no-interaction --no-scripts --no-plugins --no-ansi -o

COPY . .

RUN mkdir -p storage/framework/{cache/data,sessions,views} bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY .docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY .docker/nginx.conf /etc/nginx/http.d/default.conf

ENV APP_ENV=${APP_ENV}

EXPOSE 8080

# The image serves multiple roles via the entrypoint:
#   api       -> nginx + php-fpm (HTTP)
#   queue     -> php artisan queue:work redis --tries=3 --max-time=3600
#   scheduler -> php artisan schedule:run (cron-equivalent loop)
#   reverb    -> php artisan reverb:start --daemon (Phase 3)
ARG ROLE=api
ENV ROLE=${ROLE}

COPY .docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]