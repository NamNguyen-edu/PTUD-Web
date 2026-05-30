<?php

require_once __DIR__ . '/../View/HomeView.php';

class HomePageController
{
    public function render(): void
    {
        $view = new HomeView();
        $view->render();
    }
}
