<?php

require_once __DIR__ . '/../Model/pdo.php';

class SearchService {

    public function searchArticles(string $keyword): array {
        $keyword = trim($keyword);
        $db = pdo_get_connection();

        $sql = "
            SELECT DISTINCT
                a.article_id,
                a.title,
                a.slug,
                a.excerpt,
                a.thumbnail_url,
                a.view_count
            FROM articles a
            LEFT JOIN article_categories ac ON a.article_id = ac.article_id
            LEFT JOIN categories c ON ac.category_id = c.category_id
            LEFT JOIN article_tags at ON a.article_id = at.article_id
            LEFT JOIN tags t ON at.tag_id = t.tag_id
            WHERE a.status = 'published'
              AND (
                    a.title LIKE :keyword
                    OR a.excerpt LIKE :keyword
                    OR c.name LIKE :keyword
                    OR t.name LIKE :keyword
                  )
            ORDER BY a.view_count DESC
            LIMIT 20
        ";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':keyword', '%' . $keyword . '%');
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function searchSuggestions(string $keyword, int $limit = 6): array {
        $keyword = trim($keyword);
        if ($keyword === '') {
            return [];
        }

        $db = pdo_get_connection();
        $limit = max(1, min(20, $limit));

        $sql = "
            SELECT DISTINCT
                a.article_id,
                a.title,
                a.slug,
                a.excerpt,
                a.thumbnail_url,
                a.view_count
            FROM articles a
            LEFT JOIN article_categories ac ON a.article_id = ac.article_id
            LEFT JOIN categories c ON ac.category_id = c.category_id
            LEFT JOIN article_tags at ON a.article_id = at.article_id
            LEFT JOIN tags t ON at.tag_id = t.tag_id
            WHERE a.status = 'published'
              AND (
                    a.title LIKE :keyword
                    OR a.excerpt LIKE :keyword
                    OR c.name LIKE :keyword
                    OR t.name LIKE :keyword
                  )
            ORDER BY a.view_count DESC
            LIMIT " . $limit . "
        ";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':keyword', '%' . $keyword . '%', PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}

