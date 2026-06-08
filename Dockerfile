# Monorepo: Railway build từ repo root (không cần set Root Directory trên UI)
# Laravel API nằm trong project/api

FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip intl bcmath gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY project/api/composer.json project/api/composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

COPY project/api/ .

RUN composer dump-autoload --optimize \
    && php artisan package:discover --ansi

EXPOSE 8000

CMD ["sh", "railway/start.sh"]
