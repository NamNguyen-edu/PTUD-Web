<?php
require_once __DIR__ . '/../ViewEngine.php';

class LoginView
{
  private ViewEngine $engine;

  public function __construct(ViewEngine $engine)
  {
    $this->engine = $engine;
  }

  public function render(string $error = '', string $success = ''): void
  {
    $data = [
      'TITLE' => 'NewsPulse - Authenticate',
      'ERROR' => $error ? '<div class="alert alert-danger">' . $error . '</div>' : '',
      'SUCCESS' => $success ? '<div class="alert alert-success">' . $success . '</div>' : ''
    ];
    echo $this->engine->render('Login', $data);
  }
}
