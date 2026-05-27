<?php

require_once __DIR__ . '/../Model/pdo.php';

class VersionControlService
{

    // ─────────────────────────────────────────
    // LẤY THÔNG TIN BÀI VIẾT
    // ─────────────────────────────────────────
    public function getArticle(int $articleId): ?array
    {

        $sql = "
            SELECT
                a.*,

                c.name AS category_name

            FROM articles a

            LEFT JOIN article_categories ac
                ON ac.article_id = a.article_id
                AND ac.is_primary = 1

            LEFT JOIN categories c
                ON c.category_id = ac.category_id

            WHERE a.article_id = ?
        ";

        return pdo_query_one(
            $sql,
            $articleId
        );
    }

    // ─────────────────────────────────────────
    // LẤY DANH SÁCH VERSION
    // ─────────────────────────────────────────
    public function getVersions(
        int $articleId
    ): array {

        $sql = "
            SELECT

                av.version_id,
                av.article_id,
                av.title,
                av.content,
                av.version_name,
                av.created_at,

                u.full_name,
                u.avatar_url,

                CONCAT(
                    'v',
                    ROW_NUMBER() OVER (
                        PARTITION BY av.article_id
                        ORDER BY av.created_at DESC
                    )
                ) AS version_label

            FROM article_versions av

            LEFT JOIN users u
                ON u.user_id = av.edited_by

            WHERE av.article_id = ?

            ORDER BY av.created_at DESC
        ";

        return pdo_query(
            $sql,
            $articleId
        );
    }

    // ─────────────────────────────────────────
    // GENERATE DIFF
    // ─────────────────────────────────────────
    public function generateDiff(
        array $versions
    ): array {

        $current =
            $versions[0]['content']
            ?? '';

        $previous =
            $versions[1]['content']
            ?? '';

        return [

            'new' => $this->highlightNewText(
                $previous,
                $current
            ),

            'old' => $this->highlightRemovedText(
                $previous,
                $current
            )
        ];
    }

    // ─────────────────────────────────────────
    // HIGHLIGHT TEXT MỚI
    // ─────────────────────────────────────────
    private function highlightNewText(
        string $old,
        string $new
    ): string {

        $oldWords = preg_split(
            '/\s+/',
            strip_tags($old)
        );

        $newWords = preg_split(
            '/\s+/',
            strip_tags($new)
        );

        $html = '';

        foreach ($newWords as $word) {

            if (!in_array($word, $oldWords)) {

                $html .=
                    '<span style="
                        background:#d1fae5;
                        color:#065f46;
                        padding:2px 4px;
                        border-radius:4px;
                    ">' .
                    htmlspecialchars($word) .
                    '</span> ';
            }
            else {

                $html .=
                    htmlspecialchars($word)
                    . ' ';
            }
        }

        return nl2br($html);
    }

    // ─────────────────────────────────────────
    // HIGHLIGHT TEXT BỊ XOÁ
    // ─────────────────────────────────────────
    private function highlightRemovedText(
        string $old,
        string $new
    ): string {

        $oldWords = preg_split(
            '/\s+/',
            strip_tags($old)
        );

        $newWords = preg_split(
            '/\s+/',
            strip_tags($new)
        );

        $html = '';

        foreach ($oldWords as $word) {

            if (!in_array($word, $newWords)) {

                $html .=
                    '<span style="
                        background:#fee2e2;
                        color:#991b1b;
                        text-decoration:line-through;
                        padding:2px 4px;
                        border-radius:4px;
                    ">' .
                    htmlspecialchars($word) .
                    '</span> ';
            }
            else {

                $html .=
                    htmlspecialchars($word)
                    . ' ';
            }
        }

        return nl2br($html);
    }

    // ─────────────────────────────────────────
    // KHÔI PHỤC VERSION
    // ─────────────────────────────────────────
    public function restoreVersion(
        int $versionId
    ): bool {

        $version = pdo_query_one(
            "
            SELECT *
            FROM article_versions
            WHERE version_id = ?
            ",
            $versionId
        );

        if (!$version) {
            return false;
        }

        $sql = "
            UPDATE articles

            SET
                title = ?,
                content = ?,
                updated_at = NOW()

            WHERE article_id = ?
        ";

        pdo_execute(
            $sql,
            $version['title'],
            $version['content'],
            $version['article_id']
        );

        return true;
    }

    // ─────────────────────────────────────────
    // XOÁ VERSION
    // ─────────────────────────────────────────
    public function deleteVersion(
        int $versionId
    ): bool {

        pdo_execute(
            "
            DELETE FROM article_versions
            WHERE version_id = ?
            ",
            $versionId
        );

        return true;
    }

    // ─────────────────────────────────────────
    // TẠO VERSION MỚI
    // ─────────────────────────────────────────
    public function createVersion(
        int $articleId,
        string $title,
        string $content,
        int $editedBy
    ): bool {

        $count = pdo_query_value(
            "
            SELECT COUNT(*)
            FROM article_versions
            WHERE article_id = ?
            ",
            $articleId
        );

        $versionName =
            'v' . ($count + 1);

        $sql = "
            INSERT INTO article_versions (

                article_id,
                title,
                content,
                version_name,
                edited_by

            )

            VALUES (?, ?, ?, ?, ?)
        ";

        pdo_execute(
            $sql,
            $articleId,
            $title,
            $content,
            $versionName,
            $editedBy
        );

        return true;
    }
}