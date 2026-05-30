<?php

require_once __DIR__ . '/ViewEngine.php';

class HomeView
{
    private ViewEngine $engine;

    public function __construct(ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(array $data = []): void
    {
        echo $this->engine->render('home', $data);
    }
}
