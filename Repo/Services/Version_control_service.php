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

                CONCAT('v', av.version_name) AS version_label

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
    // ─────────────────────────────────────────
    // HIGHLIGHT TEXT MỚI (PRESERVE HTML FORMATTING)
    // ─────────────────────────────────────────
    private function highlightNewText(
        string $old,
        string $new
    ): string {
        $oldWords = preg_split(
            '/\s+/',
            strtolower(strip_tags($old)),
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        $oldWordsClean = array_map(function($w) {
            return preg_replace('/[.,?!;:"()\[\]{}*_-]/u', '', $w);
        }, $oldWords);

        $tokens = preg_split('/(<[^>]+>)/u', $new, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        $html = '';

        foreach ($tokens as $token) {
            if (str_starts_with($token, '<')) {
                $html .= $token;
            } else {
                $wordsAndSpaces = preg_split('/(\s+)/u', $token, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
                foreach ($wordsAndSpaces as $part) {
                    if (trim($part) === '') {
                        $html .= $part;
                    } else {
                        $cleanWord = preg_replace('/[.,?!;:"()\[\]{}*_-]/u', '', strtolower($part));
                        if (!in_array($cleanWord, $oldWordsClean) && !empty($cleanWord)) {
                            $html .= '<span class="diff-added" style="background:#d1fae5; color:#065f46; padding:2px 4px; border-radius:4px;">' . htmlspecialchars($part) . '</span>';
                        } else {
                            $html .= htmlspecialchars($part);
                        }
                    }
                }
            }
        }

        return $html;
    }

    // ─────────────────────────────────────────
    // HIGHLIGHT TEXT BỊ XOÁ (PRESERVE HTML FORMATTING)
    // ─────────────────────────────────────────
    private function highlightRemovedText(
        string $old,
        string $new
    ): string {
        $newWords = preg_split(
            '/\s+/',
            strtolower(strip_tags($new)),
            -1,
            PREG_SPLIT_NO_EMPTY
        );

        $newWordsClean = array_map(function($w) {
            return preg_replace('/[.,?!;:"()\[\]{}*_-]/u', '', $w);
        }, $newWords);

        $tokens = preg_split('/(<[^>]+>)/u', $old, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        $html = '';

        foreach ($tokens as $token) {
            if (str_starts_with($token, '<')) {
                $html .= $token;
            } else {
                $wordsAndSpaces = preg_split('/(\s+)/u', $token, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
                foreach ($wordsAndSpaces as $part) {
                    if (trim($part) === '') {
                        $html .= $part;
                    } else {
                        $cleanWord = preg_replace('/[.,?!;:"()\[\]{}*_-]/u', '', strtolower($part));
                        if (!in_array($cleanWord, $newWordsClean) && !empty($cleanWord)) {
                            $html .= '<span class="diff-removed" style="background:#fee2e2; color:#991b1b; text-decoration:line-through; padding:2px 4px; border-radius:4px;">' . htmlspecialchars($part) . '</span>';
                        } else {
                            $html .= htmlspecialchars($part);
                        }
                    }
                }
            }
        }

        return $html;
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

    public function createVersion(
        int $articleId,
        string $title,
        string $content,
        int $editedBy
    ): bool {

        $row = pdo_query_one(
            "
            SELECT COUNT(*) as total
            FROM article_versions
            WHERE article_id = ?
            ",
            $articleId
        );
        $count = $row ? (int)$row['total'] : 0;

        if ($count === 0) {
            $versionName = '1.0';
        } elseif ($count === 1) {
            $versionName = '1.1';
        } elseif ($count === 2) {
            $versionName = '1.2';
        } elseif ($count === 3) {
            $versionName = '1.3';
        } else {
            // Đã đạt/vượt quá 1.3 và có hành động tiếp tục -> Tự động chuyển bài viết thành rejected
            pdo_execute(
                "UPDATE articles SET status = 'rejected', updated_at = NOW() WHERE article_id = ?",
                $articleId
            );
            return false;
        }

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

    public function ensureOriginalVersion(int $articleId, string $title, string $content, int $userId): void
    {
        $row = pdo_query_one(
            "SELECT COUNT(*) as total FROM article_versions WHERE article_id = ?",
            $articleId
        );
        $count = $row ? (int)$row['total'] : 0;
        if ($count === 0) {
            $this->createVersion($articleId, $title, $content, $userId);
        }
    }
}