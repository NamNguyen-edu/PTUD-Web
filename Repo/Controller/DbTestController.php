<?php

require_once __DIR__ . '/../Model/pdo.php';

class DbTestController
{
    public function test(): void
    {
        try {
            $conn = pdo_get_connection();
            $stmt = $conn->query('SELECT DATABASE()');
            $database = $stmt->fetchColumn();
            echo '<div style="padding: 16px; margin: 16px 0; border: 1px solid green; color: green; background: #f9f9f9;">Kết nối thành công tới database: ' . htmlspecialchars($database) . '</div>';
        } catch (PDOException $e) {
            echo '<div style="padding: 16px; margin: 16px 0; border: 1px solid red; color: red; background: #f9f9f9;">Lỗi kết nối PDO: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
    }
}
