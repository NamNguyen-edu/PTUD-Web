<?php

require_once __DIR__ . '/../View/ViewEngine.php';

class HomePageController
{
    public function render(): void
    {
        $engine = new ViewEngine();
        echo $engine->render('home');
    }
}
