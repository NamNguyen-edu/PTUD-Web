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
        $catSlug = $data['category'] ?? ''; // Nhận category từ JS
        $tagsStr = $data['tags'] ?? '';     // Nhận tags từ JS

        $slug = trim($data['slug'] ?? '');
        if ($slug === '') {
            $slug = $this->generateSlug($title);
        }

        if ($articleId === 0) {
            $slug = $this->makeSlugUnique($slug);
        }

        // LƯU VÀO BẢNG ARTICLES
        if ($articleId > 0) {
            pdo_execute(
                "UPDATE articles SET title=?, content=?, slug=?, excerpt=?, status=?, updated_at=NOW() WHERE article_id=? AND user_id=?",
                $title, $content, $slug, $excerpt, $status, $articleId, $userId
            );
        } else {
            $articleId = (int) pdo_execute_return_last_id(
                "INSERT INTO articles (user_id, title, content, slug, excerpt, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                $userId, $title, $content, $slug, $excerpt, $status
            );
        }

        // 1. XỬ LÝ CHUYÊN MỤC (Tra cứu ID bằng slug và lưu vào article_categories)
        if ($catSlug !== '') {
            $catDb = pdo_query_one("SELECT category_id FROM categories WHERE slug = ? LIMIT 1", $catSlug);
            if ($catDb) {
                $categoryId = $catDb['category_id'];
                pdo_execute("DELETE FROM article_categories WHERE article_id = ?", $articleId);
                pdo_execute("INSERT INTO article_categories (article_id, category_id, is_primary) VALUES (?, ?, 1)", $articleId, $categoryId);
            }
        }

        // 2. XỬ LÝ TAGS (Cắt chuỗi, lưu vào tags và article_tags)
        pdo_execute("DELETE FROM article_tags WHERE article_id = ?", $articleId);
        if (!empty(trim($tagsStr))) {
            // Tách từ khóa bằng dấu phẩy hoặc khoảng trắng
            $tagArray = preg_split('/[\s,]+/', $tagsStr);
            foreach ($tagArray as $tag) {
                $tag = trim(str_replace('#', '', $tag)); // Xóa dấu # nếu user gõ vào
                if ($tag !== '') {
                    $tagSlug = $this->generateSlug($tag);
                    $existingTag = pdo_query_one("SELECT tag_id FROM tags WHERE slug = ? LIMIT 1", $tagSlug);
                    
                    $tagId = $existingTag ? $existingTag['tag_id'] : pdo_execute_return_last_id("INSERT INTO tags (name, slug) VALUES (?, ?)", $tag, $tagSlug);
                    
                    // Insert liên kết bài viết và thẻ
                    try {
                        pdo_execute("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)", $articleId, $tagId);
                    } catch (Exception $e) {} // Bỏ qua lỗi nếu trùng lặp
                }
            }
        }

        return $articleId;
    }

    public function getArticleById(int $articleId, int $userId): ?array
    {
        $row = pdo_query_one("SELECT * FROM articles WHERE article_id=? AND user_id=? LIMIT 1", $articleId, $userId);
        
        if ($row) {
            // Lấy category_slug để hiển thị lại ngoài Frontend
            $cat = pdo_query_one("SELECT c.slug FROM categories c JOIN article_categories ac ON c.category_id = ac.category_id WHERE ac.article_id=? LIMIT 1", $articleId);
            $row['category_slug'] = $cat ? $cat['slug'] : '';

            // Lấy chuỗi Tags (Thêm dấu # ở trước)
            $tags = pdo_query("SELECT t.name FROM tags t JOIN article_tags at ON t.tag_id = at.tag_id WHERE at.article_id=?", $articleId);
            $tagNames = array_map(function($t) { return '#' . $t['name']; }, $tags);
            $row['tags_string'] = implode(' ', $tagNames);
        }
        
        return $row ?: null;
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
}