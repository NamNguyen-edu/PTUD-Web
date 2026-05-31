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
            pdo_execute("DELETE FROM categories WHERE category_id = ?", $id);
        } else {
            pdo_execute("DELETE FROM tags WHERE tag_id = ?", $id);
        }
    }
}