<?php

require_once __DIR__ . '/../Model/pdo.php';

class DashboardAdminService {

    public function getDashboardData(): array {

        $totalArticlesSql = "
            SELECT COUNT(*) AS total_articles
            FROM articles
        ";

        $publishedArticlesSql = "
            SELECT COUNT(*) AS published_articles
            FROM articles
            WHERE status = 'published'
        ";

        $draftArticlesSql = "
            SELECT COUNT(*) AS draft_articles
            FROM articles
            WHERE status = 'draft'
        ";

        $totalViewsSql = "
            SELECT SUM(view_count) AS total_views
            FROM articles
        ";

        $latestArticlesSql = "
            SELECT
                article_id,
                title,
                slug,
                status,
                view_count,
                published_at
            FROM articles
            ORDER BY created_at DESC
            LIMIT 5
        ";

        $topViewedArticlesSql = "
            SELECT
                article_id,
                title,
                slug,
                view_count
            FROM articles
            ORDER BY view_count DESC
            LIMIT 5
        ";

        $categoryStatsSql = "
            SELECT
                c.name,
                COUNT(ac.article_id) AS total_articles
            FROM categories c
            LEFT JOIN article_categories ac
                ON c.category_id = ac.category_id
            GROUP BY c.category_id, c.name
            ORDER BY total_articles DESC
        ";

        $totalArticles = pdo_query_one($totalArticlesSql);

        $publishedArticles = pdo_query_one(
            $publishedArticlesSql
        );

        $draftArticles = pdo_query_one(
            $draftArticlesSql
        );

        $totalViews = pdo_query_one($totalViewsSql);

        $latestArticles = pdo_query($latestArticlesSql);

        $topViewedArticles = pdo_query(
            $topViewedArticlesSql
        );

        $categoryStats = pdo_query($categoryStatsSql);

        return [
            'overview' => [

                'total_articles' =>
                    $totalArticles['total_articles'] ?? 0,

                'published_articles' =>
                    $publishedArticles['published_articles'] ?? 0,

                'draft_articles' =>
                    $draftArticles['draft_articles'] ?? 0,

                'total_views' =>
                    $totalViews['total_views'] ?? 0
            ],

            'latest_articles' => $latestArticles,

            'top_viewed_articles' => $topViewedArticles,

            'category_statistics' => $categoryStats
        ];
    }
}