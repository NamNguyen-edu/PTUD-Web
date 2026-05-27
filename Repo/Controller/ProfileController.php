<?php

require_once __DIR__ . '/../Services/profile_service.php';
require_once __DIR__ . '/../View/ProfileView.php';

class ProfileController
{
    public function show(): void
    {
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

        $profileService = new ProfileService();
        $userInfo = $profileService->getUserInfo($userId);
        $userArticles = $profileService->getUserArticles($userId);

        $view = new ProfileView();
        $view->render($userInfo, $userArticles);
    }
public function updateProfile(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        
        $userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 1;
        
        // Nhận gói dữ liệu từ Frontend gửi lên
        $fullName = $_POST['full_name'] ?? '';
        $bio      = $_POST['bio'] ?? '';
        $skills   = $_POST['skills'] ?? '[]'; // Nhận chuỗi JSON kỹ năng chuyên môn
        
        // Ràng buộc bắt buộc
        if (empty(trim($fullName))) {
            echo json_encode(['success' => false, 'message' => 'Họ và tên không được để trống']);
            return;
        }

        $profileService = new ProfileService();
        
        // Thực thi gọi xuống Database Service với đầy đủ tham số
        $isSuccess = $profileService->updateUserInfo($userId, $fullName, $bio, $skills);
        
        if ($isSuccess) {
            echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống khi lưu Database']);
        }
    }

   public function uploadAvatar(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $userId = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 1;
        
        $data = json_decode(file_get_contents('php://input'), true);
        $base64 = $data['image'] ?? '';
        
        if (empty($base64)) {
            echo json_encode(['success' => false, 'message' => 'Không nhận được dữ liệu ảnh']);
            return;
        }

        try {
            // 1. Tách chuỗi Base64
            $imageParts = explode(";base64,", $base64);
            if (count($imageParts) < 2) {
                echo json_encode(['success' => false, 'message' => 'Định dạng ảnh không hợp lệ']);
                return;
            }
            
            $imageBase64 = base64_decode($imageParts[1]);
            
            // 2. Đặt tên file và tạo thư mục
            $fileName = 'avatar_' . $userId . '_' . time() . '.png';
            $baseDir = dirname(__DIR__); // Lấy gốc là thư mục Repo
            $uploadDir = $baseDir . '/UI/uploads/avatars/'; 
            
            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0777, true)) {
                    echo json_encode(['success' => false, 'message' => 'Lỗi cấp quyền: Không thể tạo thư mục avatars. Hãy làm Bước cấp quyền thủ công trên MacOS/Linux.']);
                    return;
                }
            }
            
            // 3. Lưu file xuống ổ cứng
            $filePath = $uploadDir . $fileName;
            $isSaved = file_put_contents($filePath, $imageBase64);
            
            if (!$isSaved) {
                echo json_encode(['success' => false, 'message' => "Không thể ghi file vào: $filePath. Vui lòng cấp quyền Read & Write cho thư mục UI/uploads/."]);
                return;
            }

            // Đường dẫn tương đối để HTML gọi được
            $fileUrl = 'UI/uploads/avatars/' . $fileName; 

            // 4. Lưu đường dẫn vào Database
            require_once __DIR__ . '/../Services/profile_service.php';
            $profileService = new ProfileService();
            $dbSuccess = $profileService->updateAvatarUrl($userId, $fileUrl);

            if ($dbSuccess) {
                echo json_encode(['success' => true, 'url' => $fileUrl]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Lỗi: Cập nhật đường dẫn vào Database thất bại']);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Lỗi hệ thống: ' . $e->getMessage()]);
        }
    }
}
