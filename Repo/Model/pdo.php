<?php


// Thêm query 2 lần cho search //
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
// Lưu bài viết --> tạo bản ghi mới trong DB, cập nhật bản ghi cũ nếu đã tồn tại (dựa vào ID) //


/**
 * Mở kết nối đến CSDL NewsPulse sử dụng PDO
 */

function pdo_get_connection()
{
    static $conn = null;

    if ($conn !== null) {
        return $conn;
    }

    // Tự động nạp cấu hình từ tệp .env ở thư mục gốc
    $envPath = dirname(__DIR__) . '/.env';
    $env = [];
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0 || strpos($line, '=') === false) {
                continue;
            }
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            
            // Loại bỏ dấu nháy bọc ngoài nếu có
            if (preg_match('/^([\'"])(.*)\1$/', $val, $matches)) {
                $val = $matches[2];
            }
            $env[$key] = $val;
        }
    }

    $host     = $env['DB_HOST'] ?? 'newspulsedb-newspulseg5.h.aivencloud.com';
    $port     = (int)($env['DB_PORT'] ?? 18427);
    $dbname   = $env['DB_NAME'] ?? 'news_pulse';
    $username = $env['DB_USER'] ?? 'avnadmin';
    $password = $env['DB_PASS'] ?? 'AVNS_5kpa6shKuuTPQ13VEIo';

    $sslCaFile = __DIR__ . '/../ca.pem';
    if (!empty($env['DB_SSL_CA'])) {
        $caContent = str_replace('\n', "\n", $env['DB_SSL_CA']);
        // Tự động cập nhật tệp ca.pem vật lý nếu chưa có hoặc nội dung khác với tệp cấu hình .env
        if (!file_exists($sslCaFile) || file_get_contents($sslCaFile) !== $caContent) {
            @file_put_contents($sslCaFile, $caContent);
        }
    }
    $sslCaFile = realpath($sslCaFile);

    try {
        $dburl = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        if (
            $sslCaFile &&
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
        die('Lỗi kết nối CSDL: ' . $e->getMessage());
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
