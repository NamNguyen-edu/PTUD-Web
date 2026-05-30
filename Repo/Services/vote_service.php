<?php
require_once __DIR__ . '/../Model/pdo.php';

class VoteService
{
    /**
     * Thực hiện vote hoặc bỏ vote cho bài viết
     */
    public function toggleVote(int $userId, int $articleId, string $voteType): array
    {
        $voteType = ($voteType === 'up') ? 'up' : 'down';
        
        // 1. Kiểm tra xem người dùng đã bình chọn bài viết này chưa
        $sqlCheck = "SELECT vote_id, vote_type FROM article_votes WHERE user_id = ? AND article_id = ? LIMIT 1";
        $existing = pdo_query_one($sqlCheck, $userId, $articleId);
        
        $newUserVote = null;
        
        if ($existing) {
            if ($existing['vote_type'] === $voteType) {
                // Nếu vote trùng loại -> Hủy bỏ vote (Undo)
                $sqlDelete = "DELETE FROM article_votes WHERE vote_id = ?";
                pdo_execute($sqlDelete, $existing['vote_id']);
                $newUserVote = null;
            } else {
                // Nếu vote khác loại -> Đổi loại vote
                $sqlUpdate = "UPDATE article_votes SET vote_type = ? WHERE vote_id = ?";
                pdo_execute($sqlUpdate, $voteType, $existing['vote_id']);
                $newUserVote = $voteType;
            }
        } else {
            // Nếu chưa vote bao giờ -> Thêm lượt vote mới
            $sqlInsert = "INSERT INTO article_votes (user_id, article_id, vote_type) VALUES (?, ?, ?)";
            pdo_execute($sqlInsert, $userId, $articleId, $voteType);
            $newUserVote = $voteType;
        }
        
        // 2. Cập nhật lại cột upvote_count và downvote_count trong bảng articles
        $this->syncArticleVotes($articleId);
        
        // 3. Lấy lại tổng số lượt vote sau khi đồng bộ
        $counts = $this->getVoteCounts($articleId);
        
        return [
            'upvotes' => $counts['upvote_count'],
            'downvotes' => $counts['downvote_count'],
            'user_vote' => $newUserVote
        ];
    }
    
    /**
     * Lấy trạng thái vote của người dùng hiện tại đối với bài viết
     */
    public function getUserVote(int $userId, int $articleId): ?string
    {
        $sql = "SELECT vote_type FROM article_votes WHERE user_id = ? AND article_id = ? LIMIT 1";
        $res = pdo_query_one($sql, $userId, $articleId);
        return $res ? $res['vote_type'] : null;
    }
    
    /**
     * Đồng bộ số lượng up/down vote của bài viết từ bảng chi tiết sang bảng articles
     */
    public function syncArticleVotes(int $articleId): void
    {
        $sqlUp = "SELECT COUNT(*) FROM article_votes WHERE article_id = ? AND vote_type = 'up'";
        $sqlDown = "SELECT COUNT(*) FROM article_votes WHERE article_id = ? AND vote_type = 'down'";
        
        $conn = pdo_get_connection();
        
        $stmtUp = $conn->prepare($sqlUp);
        $stmtUp->execute([$articleId]);
        $upCount = (int)$stmtUp->fetchColumn();
        
        $stmtDown = $conn->prepare($sqlDown);
        $stmtDown->execute([$articleId]);
        $downCount = (int)$stmtDown->fetchColumn();
        
        $sqlUpdate = "UPDATE articles SET upvote_count = ?, downvote_count = ? WHERE article_id = ?";
        pdo_execute($sqlUpdate, $upCount, $downCount, $articleId);
    }
    
    /**
     * Lấy lượt vote hiện tại của bài viết
     */
    public function getVoteCounts(int $articleId): array
    {
        $sql = "SELECT upvote_count, downvote_count FROM articles WHERE article_id = ? LIMIT 1";
        $res = pdo_query_one($sql, $articleId);
        if ($res) {
            return [
                'upvote_count' => (int)$res['upvote_count'],
                'downvote_count' => (int)$res['downvote_count']
            ];
        }
        return ['upvote_count' => 0, 'downvote_count' => 0];
    }
}
