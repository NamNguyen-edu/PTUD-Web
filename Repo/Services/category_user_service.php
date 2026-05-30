<?php
require_once __DIR__ . '/../Model/pdo.php';

class CategoryUserService {

    /**
     * Lấy thông tin chi tiết của Category theo slug
     */
    public function getCategoryDetails(string $slug): ?array {
        $sql = "
            SELECT 
                c1.category_id,
                c1.name,
                c1.slug,
                c1.description,
                c2.name AS parent_name,
                c2.slug AS parent_slug
            FROM categories c1
            LEFT JOIN categories c2 ON c1.parent_id = c2.category_id
            WHERE c1.slug = ?
            LIMIT 1
        ";
        $result = pdo_query($sql, $slug);
        return !empty($result) ? $result[0] : null;
    }

    /**
     * Lấy danh sách bài viết thuộc Category theo slug, có phân trang
     */
    public function getCategoryArticles(string $slug, int $page = 1): array {
        $page = max(1, $page);
        $limit = 10; // Khớp với LIMIT_BEFORE_PAGINATION = 10 trong category.js
        $offset = ($page - 1) * $limit;

        // Query lấy các bài viết thuộc category slug
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
                (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) AS trust_score,
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
            INNER JOIN article_categories ac_filter ON a.article_id = ac_filter.article_id
            INNER JOIN categories c_filter ON ac_filter.category_id = c_filter.category_id
            WHERE a.status = 'published'
              AND c_filter.slug = ?
              AND (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) >= -3
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
