<?php
/**
 * FILE KHỞI TẠO HỆ THỐNG DATABASE (NewsPulse)
 * Cơ chế: Auto-create DB -> Schema -> Migration -> Seed (Chỉ lần đầu tiên)
 */

// 1. Cấu hình kết nối (Aiven Cloud + SSL nếu cần)
$host = 'newspulsedb-newspulseg5.h.aivencloud.com';
$port = 18427;
$user = 'avnadmin';
$pass = 'AVNS_5kpa6shKuuTPQ13VEIo';
$dbname = 'news_db';
$sslCaFile = realpath(__DIR__ . '/../ca.pem');

// CHECK: Xem database đã được khởi tạo lần nào chưa (kiểm tra bảng users)
try {
    $dsnCheck = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $optionsCheck = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ];
    if ($sslCaFile && file_exists($sslCaFile) && defined('PDO::MYSQL_ATTR_SSL_CA')) {
        $optionsCheck[PDO::MYSQL_ATTR_SSL_CA] = $sslCaFile;
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $optionsCheck[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
    }
    
    $pdoCheck = new PDO($dsnCheck, $user, $pass, $optionsCheck);
    // Nếu kết nối được đến database và bảng users đã tồn tại = đã init rồi
    $checkUsers = $pdoCheck->query("SHOW TABLES LIKE 'users'")->rowCount();
    if ($checkUsers > 0) {
        // Database đã tồn tại, bỏ qua khởi tạo
        return;
    }
    unset($pdoCheck);
} catch (PDOException $e) {
    // Database chưa tồn tại, tiếp tục khởi tạo
}

try {
    // Kết nối MySQL Server (không chọn DB để tạo mới nếu cần)
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ];
    if ($sslCaFile && file_exists($sslCaFile) && defined('PDO::MYSQL_ATTR_SSL_CA')) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCaFile;
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
    }
    $pdo = new PDO($dsn, $user, $pass, $options);

    echo "<h2>Hệ thống khởi tạo Database NewsPulse (Lần đầu tiên)</h2>";

    // 2. Tạo Database nếu chưa tồn tại
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");
    echo "✔ Đã kết nối Database: <b>$dbname</b><br>";

    // 3. Khởi tạo bảng Migration (Lưu vết các thay đổi)
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // 4. Thực thi file Schema (Cấu trúc bảng gốc)
    // Split SQL statements để xử lý từng lệnh riêng (tránh lỗi index duplicate)
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    $statements = array_filter(array_map('trim', explode(';', $schemaSql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
            } catch (PDOException $e) {
                // Bỏ qua lỗi duplicate key (error 1061) - chỉ log lỗi khác
                if (strpos($e->getMessage(), '1061') === false) {
                    throw $e;
                }
            }
        }
    }
    echo "✔ Đã khởi tạo cấu trúc bảng gốc (Schema).<br>";

    // 5. Chạy cơ chế Migration (ID + Title)
    // Quét folder migrations để tìm các file .sql
    $migrationDir = __DIR__ . '/migrations';
    if (!is_dir($migrationDir)) {
        mkdir($migrationDir, 0777, true);
    }

    $migrationFiles = glob($migrationDir . '/*.sql');
    sort($migrationFiles); // Đảm bảo chạy theo thứ tự ID 001, 002...

    foreach ($migrationFiles as $file) {
        $fileName = basename($file);
        
        // Kiểm tra xem migration này đã chạy chưa
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM migrations WHERE title = ?");
        $stmt->execute([$fileName]);
        
        if ($stmt->fetchColumn() == 0) {
            $sql = file_get_contents($file);
            if (!empty(trim($sql))) {
                $pdo->exec($sql);
                
                // Lưu lại vào bảng migration
                $ins = $pdo->prepare("INSERT INTO migrations (title) VALUES (?)");
                $ins->execute([$fileName]);
                echo " Đã chạy migration thành công: <b>$fileName</b><br>";
            }
        }
    }

    // 6. Nạp dữ liệu mẫu (Seed)[cite: 1]
    // Chỉ seed nếu bảng roles hoặc users đang trống
    $countRoles = $pdo->query("SELECT COUNT(*) FROM roles")->fetchColumn();
    if ($countRoles <= 5) { // 5 là số record mặc định m đã seed trong schema
        $seedFile = __DIR__ . '/seed.sql';
        if (file_exists($seedFile)) {
            $seedSql = file_get_contents($seedFile);
            if (!empty(trim($seedSql))) {
                $pdo->exec($seedSql);
                echo "✔ Đã nạp dữ liệu mẫu thành công (Seed).<br>";
            }
        }
    }

    echo "<br><b style='color:green;'>HOÀN TẤT: Hệ thống đã sẵn sàng để phát triển!</b>";

} catch (PDOException $e) {
    echo "<b style='color:red;'>LỖI: </b>" . $e->getMessage();
}
