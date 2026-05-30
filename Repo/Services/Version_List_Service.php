<?php
// =============================================
// FILE: Services/Version_list_service.php
// =============================================

require_once __DIR__ . '/../Model/pdo.php';

class VersionListService
{
    // ─────────────────────────────────────────
    // LẤY DANH SÁCH BÀI VIẾT ĐANG CHỜ DUYỆT
    // ─────────────────────────────────────────
    public function getPendingArticles(): array
    {
        $sql = "
            SELECT
                a.article_id,
                a.title,
                a.updated_at,

                c.name AS category_name,

                u.full_name AS author_name,

                (
                    SELECT COUNT(*) + 1
                    FROM article_versions av
                    WHERE av.article_id = a.article_id
                ) AS version_count

            FROM articles a

            LEFT JOIN article_categories ac
                ON ac.article_id = a.article_id
                AND ac.is_primary = 1

            LEFT JOIN categories c
                ON c.category_id = ac.category_id

            LEFT JOIN users u
                ON u.user_id = a.user_id

            WHERE a.status = 'pending'

            ORDER BY a.updated_at DESC
        ";

        return pdo_query($sql);
    }
}