<?php
require_once __DIR__ . '/ViewEngine.php';
class LoginView
{
  private ViewEngine $engine;

  public function __construct(ViewEngine $engine = null)
  {
    $this->engine = $engine ?? new ViewEngine();
  }

  /**
   * Render giao diện Đăng nhập / Đăng ký
   * * @param array $data Dữ liệu bổ sung nếu muốn truyền vào placeholder {{KEY}} trong template html
   */
  public function render(array $data = []): void
  {

    $defaultData = [
      'META_TITLE' => $data['meta_title'] ?? 'NewsPulse - Authenticate',
    ];

    // Gộp dữ liệu mặc định với dữ liệu tùy biến truyền vào
    $mergedData = array_merge($defaultData, $data);

    // Render file 'login'
    echo $this->engine->render('login', $mergedData);
  }
}