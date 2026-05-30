<?php
require_once '../../../vendor/autoload.php'; // Đường dẫn tới file autoload của composer
session_start();

// Thông tin kết nối Database của bạn
$host = 'localhost';
$db   = 'newspulse_db';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

$clientId = 'YOUR_CLIENT_ID.apps.googleusercontent.com';

if (isset($_POST['credential'])) {
  $client = new Google_Client(['client_id' => $clientId]);
  $payload = $client->verifyIdToken($_POST['credential']);

  if ($payload) {
    $google_id = $payload['sub'];
    $email = $payload['email'];
    $name = $payload['name'];
    $avatar = $payload['picture'];

    // 1. Kiểm tra xem user này đã tồn tại trong DB NewsPulse chưa
    $sql = "SELECT * FROM users WHERE google_id = '$google_id' OR email = '$email'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
      // User đã có tài khoản -> Cập nhật thông tin mới nhất
      $conn->query("UPDATE users SET last_login = NOW() WHERE google_id = '$google_id'");
      $user_data = $result->fetch_assoc();
    } else {
      // User mới -> Thêm vào Database
      $sql_insert = "INSERT INTO users (google_id, full_name, email, avatar, role) 
                           VALUES ('$google_id', '$name', '$email', '$avatar', 'reader')";
      $conn->query($sql_insert);
      $user_data = ['full_name' => $name, 'email' => $email, 'role' => 'reader'];
    }

    // 2. Tạo Session để giữ trạng thái đăng nhập
    $_SESSION['user_id'] = $google_id;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_role'] = $user_data['role'];

    echo "success"; // Trả về text để JavaScript biết mà chuyển trang
  } else {
    echo "invalid_token";
  }
}
