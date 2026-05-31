<?php

require_once __DIR__ . '/ViewEngine.php';

class CategoryView
{
  private ViewEngine $viewEngine;

  public function __construct()
  {
    $this->viewEngine = new ViewEngine(dirname(__DIR__));
  }

  public function render(array $categories = [], array $tags = []): string
  {
    $basePath = dirname(__DIR__);

    $sidebarHtml = @file_get_contents($basePath . '/UI/html/sidebar_admin.html') ?: '';
    $headerHtml  = @file_get_contents($basePath . '/UI/html/header_admin.html') ?: '';

    // 1. Xử lý render chuỗi HTML cho danh sách Chuyên mục (Categories)
    $categoryRowsHtml = '';
    foreach ($categories as $cat) {
      $categoryRowsHtml .= '
        <tr data-id="' . $cat['category_id'] . '" data-type="Category">
          <td class="ps-4">
            <div class="d-flex align-items-center">
              <div class="cat-icon bg-tech me-3"><i class="fas fa-folder-open"></i></div>
              <div class="fw-bold item-name">' . htmlspecialchars($cat['name']) . '</div>
            </div>
          </td>
          <td class="text-center item-slug">' . htmlspecialchars($cat['slug']) . '</td>
          <td class="text-center">' . $cat['count'] . '</td>
          <td class="text-end pe-4">
            <button class="btn-action btn-edit me-1" title="Sửa"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-delete text-danger" title="Xóa"><i class="fas fa-trash"></i></button>
          </td>
        </tr>';
    }

    // 2. Xử lý render chuỗi HTML cho danh sách Thẻ từ khóa (Tags)
    $tagRowsHtml = '';
    foreach ($tags as $tag) {
      $tagRowsHtml .= '
        <tr data-id="' . $tag['tag_id'] . '" data-type="Tag">
          <td class="ps-4">
            <div class="d-flex align-items-center">
              <span class="text-muted fw-bold me-2">#</span>
              <div class="fw-bold item-name">' . htmlspecialchars($tag['name']) . '</div>
            </div>
          </td>
          <td class="text-center item-slug">' . htmlspecialchars($tag['slug']) . '</td>
          <td class="text-center">' . $tag['count'] . '</td>
          <td class="text-end pe-4">
            <button class="btn-action btn-edit me-1" title="Sửa"><i class="fas fa-edit"></i></button>
            <button class="btn-action btn-delete text-danger" title="Xóa"><i class="fas fa-trash"></i></button>
          </td>
        </tr>';
    }

    $data = [
      'SIDEBAR_COMPONENT' => $sidebarHtml,
      'HEADER_COMPONENT'  => $headerHtml,
      'CATEGORY_ROWS'     => $categoryRowsHtml, // Đổ data cứng từ PHP sinh ra
      'TAG_ROWS'          => $tagRowsHtml      // Đổ data cứng từ PHP sinh ra
    ];

    return $this->viewEngine->render('categorymanagement', $data);
  }
}
