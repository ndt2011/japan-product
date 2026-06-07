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
