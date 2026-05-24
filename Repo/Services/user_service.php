<?php
// TODO: Đảm bảo đường dẫn tới file chứa các hàm PDO của bạn là chính xác
require_once '../../Model/pdo.php'; 

class UserService {
    /**
     * Lấy danh sách người dùng (Hỗ trợ tìm kiếm)
     */
    public static function getUsers($keyword = "") {
        if (!empty($keyword)) {
            $sql = "SELECT u.user_id as id, COALESCE(u.full_name, u.username) as name, u.email, 
                           u.avatar_url as avatar, u.status, u.last_active as lastActive, r.name as role 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.role_id 
                    WHERE u.full_name LIKE ? OR u.email LIKE ?
                    ORDER BY u.created_at DESC";
            $users = pdo_query_search($sql, $keyword);
        } else {
            $sql = "SELECT u.user_id as id, COALESCE(u.full_name, u.username) as name, u.email, 
                           u.avatar_url as avatar, u.status, u.last_active as lastActive, r.name as role 
                    FROM users u 
                    JOIN roles r ON u.role_id = r.role_id 
                    ORDER BY u.created_at DESC";
            $users = pdo_query($sql);
        }

        // Format lại data cho chuẩn frontend
        $statusMap = [
            'active' => 'Active',
            'pending' => 'Pending',
            'banned' => 'Suspended'
        ];

        return array_map(function($u) use ($statusMap) {
            return [
                'id'         => $u['id'],
                'name'       => $u['name'],
                'email'      => $u['email'],
                'avatar'     => $u['avatar'] ?: 'https://i.pravatar.cc/150?u=' . $u['id'],
                'status'     => isset($statusMap[$u['status']]) ? $statusMap[$u['status']] : 'Suspended',
                'role'       => ucwords($u['role']),
                'lastActive' => $u['lastActive']
            ];
        }, $users);
    }

    /**
     * Tạo người dùng mới
     */
    public static function createUser($name, $email, $roleUI, $statusUI) {
        $statusMap = [
            'Active'    => 'active',
            'Pending'   => 'pending',
            'Suspended' => 'banned'
        ];
        $dbStatus = isset($statusMap[$statusUI]) ? $statusMap[$statusUI] : 'pending';
        $roleLower = strtolower($roleUI);

        // Lấy role_id từ DB, mặc định là 5 (reader) nếu không thấy
        $roleRow = pdo_query_one("SELECT role_id FROM roles WHERE name = ?", $roleLower);
        $roleId = $roleRow ? $roleRow['role_id'] : 5;

        $username = explode('@', $email)[0] . '_' . rand(1000, 9999);
        $passwordHash = password_hash('12345678', PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (username, email, password_hash, full_name, role_id, status) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        pdo_execute($sql, $username, $email, $passwordHash, $name, $roleId, $dbStatus);
        return true;
    }

    /**
     * Xóa một người dùng
     */
    public static function deleteSingleUser($userId) {
        $sql = "DELETE FROM users WHERE user_id = ?";
        pdo_execute($sql, $userId);
        return true;
    }

    /**
     * Xử lý thao tác hàng loạt (Delete, Suspend, Invite)
     */
    public static function processBulkAction($action, $ids) {
        if (empty($ids)) return false;

        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        if ($action === 'delete') {
            $sql = "DELETE FROM users WHERE user_id IN ($placeholders)";
            pdo_execute($sql, ...$ids);
            return "Đã xóa vĩnh viễn các tài khoản đã chọn.";
        } 
        
        if ($action === 'suspend') {
            $sql = "UPDATE users SET status = 'banned' WHERE user_id IN ($placeholders)";
            pdo_execute($sql, ...$ids);
            return "Đã đình chỉ thành công.";
        } 
        
        if ($action === 'invite') {
            // Logic gửi email thực tế sẽ nằm ở đây
            return "Đã gửi Email lời mời cho các tài khoản!";
        }

        throw new Exception("Thao tác không hợp lệ.");
    }
}
?>