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
            WHERE a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT $limit OFFSET $offset
        ";

        $articles = pdo_query($sql);
    
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
