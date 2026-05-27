<?php
require_once __DIR__ . '/../Model/pdo.php';

class PostnewsService
{
    public function saveArticle(int $userId, array $data): int
    {
        $articleId = isset($data['article_id']) ? intval($data['article_id']) : 0;

        $title   = $data['title']   ?? '';
        $content = $data['content'] ?? '';
        $excerpt = $data['excerpt'] ?? '';
        $status  = $data['status']  ?? 'draft';
        $slug = trim($data['slug'] ?? '');

        // ==================================================
        // ĐOẠN CODE MỚI: XỬ LÝ UPLOAD ẢNH ĐẠI DIỆN
        // ==================================================
        $thumbnailUrl = null;
        if (isset($data['thumbnail_file'])) {
            // Gọi hàm upload file ở phía dưới
            $thumbnailUrl = $this->handleFileUpload($data['thumbnail_file'], $userId);
        }

        if ($slug === '') {
            $slug = $this->generateSlug($title);
        }

        if ($articleId === 0) {
            $slug = $this->makeSlugUnique($slug);
        }

        // CẬP NHẬT CÂU LỆNH SQL ĐỂ CÓ THÊM TRƯỜNG THUMBNAIL_URL
        if ($articleId > 0) {
            // Nếu có upload ảnh mới thì cập nhật ảnh, nếu không thì giữ nguyên ảnh cũ
            $sql = "UPDATE articles 
                    SET title=?, content=?, slug=?, excerpt=?, status=?, updated_at=NOW()";
            $params = [$title, $content, $slug, $excerpt, $status];
            
            if ($thumbnailUrl) {
                $sql .= ", thumbnail_url=?";
                $params[] = $thumbnailUrl;
            }
            
            $sql .= " WHERE article_id=? AND user_id=?";
            $params[] = $articleId;
            $params[] = $userId;

            pdo_execute($sql, ...$params); // Sử dụng splat operator (...) để truyền array thành argument

            return $articleId;
        }

        // INSERT MỚI
        return (int) pdo_execute_return_last_id(
            "INSERT INTO articles (user_id, title, content, slug, excerpt, status, thumbnail_url, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            $userId, $title, $content, $slug, $excerpt, $status, $thumbnailUrl
        );
    }

    // ==================================================
    // HÀM PHỤ TRỢ: XỬ LÝ UPLOAD FILE THỰC SỰ
    // ==================================================
    private function handleFileUpload(array $file, int $userId): ?string
    {
        // 1. Kiểm tra lỗi
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return null;
        }

        // 2. Validate file type (chỉ nhận ảnh)
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file['mime_type'], $allowedTypes)) {
            // Bạn có thể quăng Exception ở đây nếu muốn validate chặt
            return null;
        }

        // 3. Tạo tên file duy nhất để tránh trùng
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'thumb_' . $userId . '_' . time() . '_' . uniqid() . '.' . $ext;

        // 4. Thiết lập thư mục upload (ví dụ: UI/uploads/articles/)
        $uploadDir = __DIR__ . '/../UI/uploads/articles/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // 5. Di chuyển file vào thư mục
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
            // Trả về đường dẫn để lưu vào DB (đường dẫn tương đối tính từ index.php)
            return 'UI/uploads/articles/' . $fileName;
        }

        return null;
    }

    private function generateSlug(string $title): string
    {
        $slug = mb_strtolower(trim($title));

        // Chuyển tiếng Việt có dấu → không dấu
        $from = ['à','á','ả','ã','ạ','ă','ắ','ặ','ằ','ẳ','ẵ','â','ấ','ầ','ẩ','ẫ','ậ',
                 'đ','è','é','ẻ','ẽ','ẹ','ê','ế','ề','ể','ễ','ệ',
                 'ì','í','ỉ','ĩ','ị','ò','ó','ỏ','õ','ọ','ô','ố','ồ','ổ','ỗ','ộ',
                 'ơ','ớ','ờ','ở','ỡ','ợ','ù','ú','ủ','ũ','ụ','ư','ứ','ừ','ử','ữ','ự',
                 'ỳ','ý','ỷ','ỹ','ỵ'];
        $to   = ['a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
                 'd','e','e','e','e','e','e','e','e','e','e','e',
                 'i','i','i','i','i','o','o','o','o','o','o','o','o','o','o','o',
                 'o','o','o','o','o','o','u','u','u','u','u','u','u','u','u','u','u',
                 'y','y','y','y','y'];
        $slug = str_replace($from, $to, $slug);

        // Xóa ký tự đặc biệt, thay space bằng dấu gạch
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', trim($slug));

        // Giới hạn độ dài
        $slug = substr($slug, 0, 200);

        return $slug ?: 'bai-viet-' . time();
    }

    private function makeSlugUnique(string $slug): string
    {
        $existing = pdo_query_one(
            "SELECT article_id FROM articles WHERE slug = ? LIMIT 1",
            $slug
        );

        if (!$existing) {
            return $slug;
        }

        return $slug . '-' . time();
    }

    public function getArticleById(int $articleId, int $userId): ?array
    {
        $row = pdo_query_one(
            "SELECT * FROM articles WHERE article_id=? AND user_id=? LIMIT 1",
            $articleId, $userId
        );
        return $row ?: null;
    }
}