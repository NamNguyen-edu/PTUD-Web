<?php

require_once __DIR__ . '/../Model/pdo.php';

class CategoryService {

    /**
     * Lấy thông tin chi tiết của một chuyên mục (tên, mô tả, ảnh...)
     */
    public function getCategoryDetails(string $slug): ?array {
        $sql = "
            SELECT category_id, name, slug, description, thumbnail_url
            FROM categories
            WHERE slug = ? AND is_active = 1
            LIMIT 1
        ";
        return pdo_query_one($sql, $slug) ?: null;
    }

    /**
     * Lấy danh sách bài viết thuộc chuyên mục theo phân trang (đã tối ưu hóa N+1 query)
     */
    public function getCategoryArticles(string $slug, int $page = 1): array {
        $page = max(1, $page);
        $limit = 6;
        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT
                a.article_id,
                a.title,
                a.slug,
                a.excerpt,
                a.thumbnail_url,
                a.view_count,
                a.upvote_count,
                a.downvote_count,
                a.published_at,
                (
                    SELECT GROUP_CONCAT(t.name SEPARATOR ',')
                    FROM tags t
                    INNER JOIN article_tags at ON t.tag_id = at.tag_id
                    WHERE at.article_id = a.article_id
                ) AS tag_names,
                (
                    SELECT GROUP_CONCAT(c.name SEPARATOR ',')
                    FROM categories c
                    INNER JOIN article_categories ac ON c.category_id = ac.category_id
                    WHERE ac.article_id = a.article_id
                ) AS category_names
            FROM articles a
            INNER JOIN article_categories ac ON a.article_id = ac.article_id
            INNER JOIN categories c ON ac.category_id = c.category_id
            WHERE a.status = 'published' AND c.slug = ?
            ORDER BY a.published_at DESC
            LIMIT $limit OFFSET $offset
        ";

        $articles = pdo_query($sql, $slug);

        foreach ($articles as &$article) {
            $article['tags'] = !empty($article['tag_names']) ? explode(',', $article['tag_names']) : [];
            $article['categories'] = !empty($article['category_names']) ? explode(',', $article['category_names']) : [];
            
            unset($article['tag_names']);
            unset($article['category_names']);
        }

        return [
            'page' => $page,
            'items' => $articles,
            'has_more' => count($articles) >= $limit
        ];
    }
}
