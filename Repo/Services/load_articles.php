<?php

require_once __DIR__ . '/../Model/pdo.php';

class ArticleService {

    public function getArticleBySlug(string $slug): ?array {

        $slug = trim($slug);

        $sql = "
            SELECT
                a.article_id,
                a.title,
                a.slug,
                a.content,
                a.excerpt,
                a.thumbnail_url,
                a.view_count,
                a.published_at,
                u.full_name AS author_name
            FROM articles a
            LEFT JOIN users u
                ON a.user_id = u.user_id
            WHERE a.slug = ?
              AND a.status = 'published'
            LIMIT 1
        ";

        $article = pdo_query_one($sql, $slug);

        if (!$article) {
            return null;
        }

        $tagSql = "
            SELECT t.name
            FROM tags t
            INNER JOIN article_tags at
                ON t.tag_id = at.tag_id
            WHERE at.article_id = ?
        ";

        $tags = pdo_query(
            $tagSql,
            $article['article_id']
        );

        $categorySql = "
            SELECT c.name
            FROM categories c
            INNER JOIN article_categories ac
                ON c.category_id = ac.category_id
            WHERE ac.article_id = ?
        ";

        $categories = pdo_query(
            $categorySql,
            $article['article_id']
        );

        $article['tags'] = array_column($tags, 'name');

        $article['categories'] = array_column(
            $categories,
            'name'
        );

        $this->increaseViewCount(
            $article['article_id']
        );
        if (!empty($_SESSION['user_id'])) {

        $this->saveReadHistory(
            (int) $_SESSION['user_id'],
            (int) $article['article_id']
        );
        }
        return $article;
    }

    private function increaseViewCount(int $articleId): void {

        $sql = "
            UPDATE articles
            SET view_count = view_count + 1
            WHERE article_id = ?
        ";

        pdo_execute($sql, $articleId);
    }
    private function saveReadHistory(int $userId,int $articleId): void {
        $sql = "
            INSERT INTO user_read_history (
                user_id,
                article_id,
                read_count,
                first_read_at,
                last_read_at
            )
            VALUES (?, ?, 1, NOW(), NOW())

            ON DUPLICATE KEY UPDATE
                read_count = read_count + 1,
                last_read_at = NOW()
        ";
        pdo_execute( $sql, $userId, $articleId);
    }  

    public function getRelatedArticles(
        int $articleId,
        int $limit = 3
    ): array {

        $limit = (int) $limit;

        $sql = "
            SELECT
                a.article_id,
                a.title,
                a.slug,
                a.thumbnail_url,
                a.excerpt,
                a.view_count
            FROM articles a
            WHERE a.status = 'published'
              AND a.article_id != $articleId
            ORDER BY a.view_count DESC
            LIMIT $limit
        ";

        return pdo_query($sql);
    }
}
