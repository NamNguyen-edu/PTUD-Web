<?php
session_start();

// 1. Kết nối Database (Mày vẫn cần cái này để lưu user)
$conn = new mysqli('localhost', 'root', '', 'newspulse_db');
$conn->set_charset("utf8mb4");

if (isset($_POST['credential'])) {
  $id_token = $_POST['credential'];

  // 2. GỌI API GOOGLE ĐỂ KIỂM TRA TOKEN 
  $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

  $response = curl_exec($ch);
  $info = curl_getinfo($ch);
  curl_close($ch);

  // 3. Giải mã dữ liệu JSON mà Google trả về
  $payload = json_decode($response, true);

  if ($info['http_code'] == 200 && isset($payload['email'])) {

    $google_id = $payload['sub'];
    $email = $payload['email'];
    $name = $payload['name'];
    $avatar = $payload['picture'];

    // 4. LƯU VÀO DATABASE (Dùng Prepared Statement cho an toàn)
    $stmt = $conn->prepare("SELECT * FROM users WHERE google_id = ? OR email = ?");
    $stmt->bind_param("ss", $google_id, $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
      // User cũ -> Cập nhật
      $upd = $conn->prepare("UPDATE users SET last_login = NOW() WHERE google_id = ?");
      $upd->bind_param("s", $google_id);
      $upd->execute();
    } else {
      // User mới -> Thêm mới
      $role = 'reader';
      $ins = $conn->prepare("INSERT INTO users (google_id, full_name, email, avatar, role) VALUES (?, ?, ?, ?, ?)");
      $ins->bind_param("sssss", $google_id, $name, $email, $avatar, $role);
      $ins->execute();
    }

    // 5. Tạo Session
    $_SESSION['user_id'] = $google_id;
    $_SESSION['user_name'] = $name;

    echo "success";
  } else {
    echo "invalid_token_from_google";
  }
}