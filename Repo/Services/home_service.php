<?php

require_once __DIR__ . '/../Model/pdo.php';

class HomeService {

    public function getHomepageFeed(int $page = 1): array {

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
                a.published_at
            FROM articles a
            WHERE a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT $limit OFFSET $offset
        ";

        $articles = pdo_query($sql);
    
        foreach ($articles as &$article) {

            $tagSql = "
                SELECT t.name
                FROM tags t
                INNER JOIN article_tags at
                    ON t.tag_id = at.tag_id
                WHERE at.article_id = ?
            ";

            $tags = pdo_query($tagSql, $article['article_id']);

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
        }

        return [
            'page' => $page,
            'items' => $articles,
            'has_more' => count($articles) >= $limit
        ];
    }
}
