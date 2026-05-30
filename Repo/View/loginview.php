<?php
require_once __DIR__ . '/ViewEngine.php';

class LoginView
{
  private ViewEngine $engine;

  public function __construct(ViewEngine $engine = null)
  {
    $this->engine = $engine ?? new ViewEngine();
  }

  public function render(string $error = ''): void
  {
    // Chuẩn bị dữ liệu để map vào template
    $data = [
      'ERROR_MESSAGE' => !empty($error) ? '<div class="alert alert-danger">' . $error . '</div>' : ''
    ];

    // ViewEngine sẽ tìm file login.html, thay thế {{ERROR_MESSAGE}} bằng HTML bên trên
    echo $this->engine->render('login', $data);
  }
}