<?php
require_once(__DIR__ . '/../Model/pdo.php');

class CategoryTagModel
{
    // --- Lấy dữ liệu ---
    public function getAllCategories()
    {
        $sql = "SELECT c.category_id, c.name, c.slug, COUNT(ac.article_id) as count 
                FROM categories c 
                LEFT JOIN article_categories ac ON c.category_id = ac.category_id 
                GROUP BY c.category_id 
                ORDER BY c.sort_order ASC, c.category_id DESC";
        return pdo_query($sql);
    }

    public function getAllTags()
    {
        $sql = "SELECT t.tag_id, t.name, t.slug, COUNT(at.article_id) as count 
                FROM tags t 
                LEFT JOIN article_tags at ON t.tag_id = at.tag_id 
                GROUP BY t.tag_id 
                ORDER BY t.tag_id DESC";
        return pdo_query($sql);
    }

    // --- Thêm mới ---
    public function insert($type, $name, $slug)
    {
        if ($type === 'Category') {
            return pdo_execute_return_last_id("INSERT INTO categories (name, slug) VALUES (?, ?)", $name, $slug);
        } else {
            return pdo_execute_return_last_id("INSERT INTO tags (name, slug) VALUES (?, ?)", $name, $slug);
        }
    }

    // --- Cập nhật ---
    public function update($type, $id, $name, $slug)
    {
        if ($type === 'Category') {
            pdo_execute("UPDATE categories SET name = ?, slug = ? WHERE category_id = ?", $name, $slug, $id);
        } else {
            pdo_execute("UPDATE tags SET name = ?, slug = ? WHERE tag_id = ?", $name, $slug, $id);
        }
    }

    // --- Xóa ---
    public function delete($type, $id)
    {
        if ($type === 'Category') {
            // Kiểm tra xem có bài viết nào liên kết tới chuyên mục này không
            $sqlCheck = "SELECT COUNT(*) as count FROM article_categories WHERE category_id = ?";
            $res = pdo_query_one($sqlCheck, $id);
            if ($res && $res['count'] > 0) {
                throw new Exception("Không thể xóa chuyên mục này vì đang có bài viết liên kết tới!");
            }
            pdo_execute("DELETE FROM categories WHERE category_id = ?", $id);
        } else {
            // Kiểm tra xem có bài viết nào liên kết tới thẻ này không
            $sqlCheck = "SELECT COUNT(*) as count FROM article_tags WHERE tag_id = ?";
            $res = pdo_query_one($sqlCheck, $id);
            if ($res && $res['count'] > 0) {
                throw new Exception("Không thể xóa thẻ này vì đang có bài viết liên kết tới!");
            }
            pdo_execute("DELETE FROM tags WHERE tag_id = ?", $id);
        }
    }
}