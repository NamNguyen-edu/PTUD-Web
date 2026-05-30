<?php

require_once __DIR__ . '/../Model/pdo.php';

class HomeService {

    public function getHomepageFeed(int $page = 1, ?string $categorySlug = null): array {
        $page = max(1, $page);
        $limit = 16;
        $offset = ($page - 1) * $limit;

        $params = [];
        $categoryJoin = "";
        $categoryWhere = "";

        if ($categorySlug !== null && $categorySlug !== 'for-you' && $categorySlug !== 'trending') {
            $categoryJoin = "
                INNER JOIN article_categories ac_filter ON a.article_id = ac_filter.article_id
                INNER JOIN categories c_filter ON ac_filter.category_id = c_filter.category_id
            ";
            $categoryWhere = "AND c_filter.slug = ?";
            $params[] = $categorySlug;
        }

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
            $categoryJoin
            WHERE a.status = 'published'
              AND (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) >= -3
              $categoryWhere
            ORDER BY trust_score DESC, a.published_at DESC
            LIMIT $limit OFFSET $offset
        ";

        $articles = pdo_query($sql, ...$params);
    
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

    public function getTrendingFeed(int $page = 1): array {
        $page = max(1, $page);
        $limit = 16;
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
            WHERE a.status = 'published'
              AND (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) >= -3
            ORDER BY a.view_count DESC, trust_score DESC, a.published_at DESC
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

    public function getForYouFeed(int $page = 1, array $preferredTopics = []): array {
        $mapping = [
            'Tech' => 'cong-nghe',
            'Biz' => 'kinh-doanh',
            'Fin' => 'tai-chinh',
            'Start' => 'startup',
            'Edu' => 'giao-duc',
            'Life' => 'doi-song',
            'World' => 'thoi-su',
        ];

        $slugs = [];
        foreach ($preferredTopics as $topic) {
            $topic = trim($topic);
            if (isset($mapping[$topic])) {
                $slugs[] = $mapping[$topic];
            }
        }

        if (empty($slugs)) {
            return $this->getHomepageFeed($page);
        }

        $page = max(1, $page);
        $limit = 16;
        $offset = ($page - 1) * $limit;

        $placeholders = implode(',', array_fill(0, count($slugs), '?'));

        $sql = "
            SELECT DISTINCT
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
            INNER JOIN article_categories ac ON a.article_id = ac.article_id
            INNER JOIN categories c ON ac.category_id = c.category_id
            WHERE a.status = 'published' AND c.slug IN ($placeholders)
              AND (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) >= -3
            ORDER BY trust_score DESC, a.published_at DESC
            LIMIT $limit OFFSET $offset
        ";

        $articles = pdo_query($sql, ...$slugs);

        
        if (empty($articles)) {
            return $this->getHomepageFeed($page);
        }

        
        
        
        if (count($articles) < $limit && $page === 1) {
            $needed = $limit - count($articles);
            $excludeIds = array_column($articles, 'article_id');
            if (empty($excludeIds)) {
                $excludeIds = [0];
            }
            $placeholdersExclude = implode(',', array_fill(0, count($excludeIds), '?'));
            
            $fallbackSql = "
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
                WHERE a.status = 'published'
                  AND (CAST(a.upvote_count AS SIGNED) - CAST(a.downvote_count AS SIGNED)) >= -3
                  AND a.article_id NOT IN ($placeholdersExclude)
                ORDER BY trust_score DESC, a.published_at DESC
                LIMIT $needed
            ";
            $fallbackArticles = pdo_query($fallbackSql, ...$excludeIds);
            $articles = array_merge($articles, $fallbackArticles);
        }

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

    public function getHotNewsOfTheDay(int $limit = 4): array {
        
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
            WHERE a.status = 'published'
              AND a.published_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY a.view_count DESC
            LIMIT $limit
        ";
        $articles = pdo_query($sql);

        
        if (count($articles) < $limit) {
            $needed = $limit - count($articles);
            $excludeIds = empty($articles) ? [0] : array_column($articles, 'article_id');
            $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
            
            $fallbackSql = "
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
                WHERE a.status = 'published'
                  AND a.article_id NOT IN ($placeholders)
                ORDER BY a.view_count DESC
                LIMIT $needed
            ";
            $fallbackArticles = pdo_query($fallbackSql, ...$excludeIds);
            $articles = array_merge($articles, $fallbackArticles);
        }

        foreach ($articles as &$article) {
            $article['tags'] = !empty($article['tag_names']) ? explode(',', $article['tag_names']) : [];
            $article['categories'] = !empty($article['category_names']) ? explode(',', $article['category_names']) : [];
            
            unset($article['tag_names']);
            unset($article['category_names']);
        }

        
        usort($articles, function($a, $b) {
            return $b['view_count'] <=> $a['view_count'];
        });

        return $articles;
    }

    public function getVideoFeed(): array {
        $sql = "SELECT media_id, filename, url, mime_type, size_bytes, alt_text as title, created_at 
                FROM media 
                WHERE mime_type LIKE 'video/%' 
                ORDER BY created_at DESC 
                LIMIT 10";
        return pdo_query($sql);
    }
}
