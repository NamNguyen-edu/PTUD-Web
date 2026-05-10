<?php
/**
 * FILE KHỞI TẠO HỆ THỐNG DATABASE (NewsPulse)
 * Cơ chế: Auto-create DB -> Schema -> Migration -> Seed
 */

// 1. Cấu hình kết nối (Dành cho XAMPP mặc định)
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'news_db';

try {
    // Kết nối MySQL Server (không chọn DB để tạo mới nếu cần)
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h2>Hệ thống khởi tạo Database NewsPulse</h2>";

    // 2. Tạo Database nếu chưa tồn tại
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname` text");
    echo "✔ Đã kết nối Database: <b>$dbname</b><br>";

    // 3. Khởi tạo bảng Migration (Lưu vết các thay đổi như m yêu cầu)
    $pdo->exec("CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // 4. Thực thi file Schema (Cấu trúc bảng gốc)
    // Kiểm tra xem đã có schema chưa (ví dụ kiểm tra bảng users)
    $checkSchema = $pdo->query("SHOW TABLES LIKE 'users'")->rowCount();
    if ($checkSchema == 0) {
        $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
        $pdo->exec($schemaSql);
        echo "✔ Đã khởi tạo cấu trúc bảng gốc (Schema).<br>";
    } else {
        echo "ℹ Cấu trúc bảng gốc đã tồn tại, bỏ qua bước Schema.<br>";
    }

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
                echo "🚀 Đã chạy migration thành công: <b>$fileName</b><br>";
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
