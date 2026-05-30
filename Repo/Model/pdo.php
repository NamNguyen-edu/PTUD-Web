<?php

function pdo_query_search($sql, $keyword)
{

    try {

        $conn = pdo_get_connection();

        $stmt = $conn->prepare($sql);

        $searchTerm = "%" . $keyword . "%";

        $stmt->bindValue(1, $searchTerm);

        $stmt->bindValue(2, $searchTerm);

        $stmt->execute();

        return $stmt->fetchAll();
    } catch (PDOException $e) {

        throw $e;
    }
}

function loadDotEnv()
{
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                $value = str_replace('\n', "\n", $value);
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

function pdo_get_connection()
{

    static $conn = null;

    if ($conn !== null) {
        return $conn;
    }

    loadDotEnv();

    // --Lấy từ file .env
    $host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? 'localhost');
    $port = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? 3306);
    $dbname = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? '');
    $username = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? '');
    $password = getenv('DB_PASS') ?: ($_ENV['DB_PASS'] ?? '');

    // --Lấy từ file .env
    $sslCaContent = getenv('DB_SSL_CA') ?: ($_ENV['DB_SSL_CA'] ?? '');
    $sslCaFile = sys_get_temp_dir() . '/ca_pulse.pem';
    if (!empty($sslCaContent) && !file_exists($sslCaFile)) {
        file_put_contents($sslCaFile, $sslCaContent);
    }

    try {
        $dburl = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        if (
            !empty($sslCaContent) &&
            file_exists($sslCaFile) &&
            defined('PDO::MYSQL_ATTR_SSL_CA')
        ) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCaFile;

            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
        }

        $conn = new PDO(
            $dburl,
            $username,
            $password,
            $options
        );

        return $conn;
    } catch (PDOException $e) {
        throw new PDOException('Lỗi kết nối CSDL: ' . $e->getMessage(), (int)$e->getCode(), $e);
    }
}


/**
 * Thực thi các lệnh INSERT, UPDATE, DELETE
 */
function pdo_execute($sql)
{
    $sql_args = array_slice(func_get_args(), 1);
    try {
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
    } catch (PDOException $e) {
        throw $e;
    } finally {
        unset($conn);
    }
}

/**
 * Truy vấn danh sách bản ghi (SELECT nhiều dòng)
 */
function pdo_query($sql)
{
    $sql_args = array_slice(func_get_args(), 1);
    try {
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        throw $e;
    } finally {
        unset($conn);
    }
}

/**
 * Truy vấn 1 bản ghi (SELECT một dòng)
 */
function pdo_query_one($sql)
{
    $sql_args = array_slice(func_get_args(), 1);
    try {
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $stmt->fetch();
    } catch (PDOException $e) {
        throw $e;
    } finally {
        unset($conn);
    }
}

/**
 * Thực thi lệnh INSERT và lấy về ID vừa tạo
 */
function pdo_execute_return_last_id($sql)
{
    $sql_args = array_slice(func_get_args(), 1);
    try {
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $conn->lastInsertId();
    } catch (PDOException $e) {
        throw $e;
    } finally {
        unset($conn);
    }
}
