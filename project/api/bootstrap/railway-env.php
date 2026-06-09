<?php

declare(strict_types=1);

/**
 * Railway: đảm bảo MYSQL* / DB_* có trong $_ENV trước khi Laravel boot.
 */
$setEnv = static function (string $key, string $value): void {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
};

$getEnv = static function (string $key): ?string {
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    return ($value !== false && $value !== '') ? (string) $value : null;
};

$map = [
    'DB_HOST' => ['MYSQLHOST'],
    'DB_PORT' => ['MYSQLPORT'],
    'DB_DATABASE' => ['MYSQLDATABASE'],
    'DB_USERNAME' => ['MYSQLUSER'],
    'DB_PASSWORD' => ['MYSQLPASSWORD'],
];

foreach ($map as $target => $sources) {
    if ($getEnv($target) !== null) {
        continue;
    }
    foreach ($sources as $source) {
        $value = $getEnv($source);
        if ($value !== null) {
            $setEnv($target, $value);
            break;
        }
    }
}

if ($getEnv('DB_URL') === null && ($mysqlUrl = $getEnv('MYSQL_URL')) !== null) {
    $setEnv('DB_URL', $mysqlUrl);
}

$connection = $getEnv('DB_CONNECTION');
$hasMysql = $getEnv('DB_HOST') !== null || $getEnv('DB_URL') !== null;

if (($connection === null || $connection === 'sqlite') && $hasMysql) {
    $setEnv('DB_CONNECTION', 'mysql');
}

// Redis plugin: Laravel đọc REDIS_URL; Railway Redis service dùng REDISHOST / REDISPORT / ...
$redisMap = [
    'REDIS_HOST' => ['REDISHOST'],
    'REDIS_PORT' => ['REDISPORT'],
    'REDIS_PASSWORD' => ['REDISPASSWORD', 'REDIS_PASSWORD'],
    'REDIS_USERNAME' => ['REDISUSER'],
];

foreach ($redisMap as $target => $sources) {
    if ($getEnv($target) !== null) {
        continue;
    }
    foreach ($sources as $source) {
        $value = $getEnv($source);
        if ($value !== null) {
            $setEnv($target, $value);
            break;
        }
    }
}

if ($getEnv('REDIS_URL') === null) {
    $host = $getEnv('REDIS_HOST');
    $port = $getEnv('REDIS_PORT') ?? '6379';
    $user = $getEnv('REDIS_USERNAME');
    $password = $getEnv('REDIS_PASSWORD');

    if ($host !== null) {
        $auth = '';
        if ($user !== null && $password !== null) {
            $auth = rawurlencode($user).':'.rawurlencode($password).'@';
        } elseif ($password !== null) {
            $auth = ':'.rawurlencode($password).'@';
        }

        $setEnv('REDIS_URL', "redis://{$auth}{$host}:{$port}");
    }
}
