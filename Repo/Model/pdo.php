<?php


// Thêm query 2 lần cho search //
// Lưu bài viết --> tạo bản ghi mới trong DB, cập nhật bản ghi cũ nếu đã tồn tại (dựa vào ID) //


/**
 * Mở kết nối đến CSDL NewsPulse sử dụng PDO
 */

function pdo_get_connection(){
    $host = 'newspulsedb-newspulseg5.h.aivencloud.com';
    $port = 18427;
    $dbname = 'defaultdb';
    $username = 'avnadmin';
    $password = 'AVNS_5kpa6shKuuTPQ13VEIo';
    $sslCaFile = realpath(__DIR__ . '/../ca.perm');

    try {
        $dburl = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        if ($sslCaFile && file_exists($sslCaFile) && defined('PDO::MYSQL_ATTR_SSL_CA')) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCaFile;
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
        }

        $conn = new PDO($dburl, $username, $password, $options);
        return $conn;
    } catch (PDOException $e) {
        die("Lỗi kết nối CSDL: " . $e->getMessage());
    }
}

/**
 * Thực thi các lệnh INSERT, UPDATE, DELETE
 */
function pdo_execute($sql){
    $sql_args = array_slice(func_get_args(), 1);
    try{
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
    }
    catch(PDOException $e){ throw $e; }
    finally{ unset($conn); }
}

/**
 * Truy vấn danh sách bản ghi (SELECT nhiều dòng)
 */
function pdo_query($sql){
    $sql_args = array_slice(func_get_args(), 1);
    try{
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $stmt->fetchAll();
    }
    catch(PDOException $e){ throw $e; }
    finally{ unset($conn); }
}

/**
 * Truy vấn 1 bản ghi (SELECT một dòng)
 */
function pdo_query_one($sql){
    $sql_args = array_slice(func_get_args(), 1);
    try{
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $stmt->fetch();
    }
    catch(PDOException $e){ throw $e; }
    finally{ unset($conn); }
}

/**
 * Thực thi lệnh INSERT và lấy về ID vừa tạo
 */
function pdo_execute_return_last_id($sql){
    $sql_args = array_slice(func_get_args(), 1);
    try {
        $conn = pdo_get_connection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($sql_args);
        return $conn->lastInsertId();
    } 
    catch (PDOException $e) { throw $e; } 
    finally { unset($conn); }
}