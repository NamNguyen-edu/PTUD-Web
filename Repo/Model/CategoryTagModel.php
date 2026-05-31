<?php
require_once __DIR__ . '/pdo.php';

class CategoryTagModel
{
    /**
     * Lấy toàn bộ chuyên mục kèm số lượng bài viết tương ứng
     */
    public function getAllCategories(): array
    {
        $sql = "
            SELECT c.category_id AS id, c.category_id, c.name, c.slug, COUNT(ac.article_id) AS count
            FROM categories c
            LEFT JOIN article_categories ac ON c.category_id = ac.category_id
            GROUP BY c.category_id, c.name, c.slug
            ORDER BY c.category_id DESC
        ";
        return pdo_query($sql);
    }

    /**
     * Lấy toàn bộ thẻ Tag kèm số lượng bài viết tương ứng
     */
    public function getAllTags(): array
    {
        $sql = "
            SELECT t.tag_id AS id, t.tag_id, t.name, t.slug, COUNT(at.article_id) AS count
            FROM tags t
            LEFT JOIN article_tags at ON t.tag_id = at.tag_id
            GROUP BY t.tag_id, t.name, t.slug
            ORDER BY t.tag_id DESC
        ";
        return pdo_query($sql);
    }

    /**
     * Thêm mới chuyên mục hoặc thẻ từ khóa
     */
    public function insert(string $type, string $name, string $slug): int
    {
        if ($type === 'Category') {
            $sql = "INSERT INTO categories (name, slug) VALUES (?, ?)";
            return pdo_execute_return_last_id($sql, $name, $slug);
        } else {
            $sql = "INSERT INTO tags (name, slug) VALUES (?, ?)";
            return pdo_execute_return_last_id($sql, $name, $slug);
        }
    }

    /**
     * Chỉnh sửa thông tin chuyên mục hoặc thẻ từ khóa
     */
    public function update(string $type, int $id, string $name, string $slug): void
    {
        if ($type === 'Category') {
            $sql = "UPDATE categories SET name = ?, slug = ? WHERE category_id = ?";
            pdo_execute($sql, $name, $slug, $id);
        } else {
            $sql = "UPDATE tags SET name = ?, slug = ? WHERE tag_id = ?";
            pdo_execute($sql, $name, $slug, $id);
        }
    }

    /**
     * Xóa chuyên mục hoặc thẻ từ khóa
     */
    public function delete(string $type, int $id): void
    {
        if ($type === 'Category') {
            $sql = "DELETE FROM categories WHERE category_id = ?";
            pdo_execute($sql, $id);
        } else {
            $sql = "DELETE FROM tags WHERE tag_id = ?";
            pdo_execute($sql, $id);
        }
    }
}
