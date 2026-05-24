<?php
require_once __DIR__ . '/ViewEngine.php';

class PostnewsView
{
    private ViewEngine $engine;

    public function __construct(ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(?array $article): void
    {
        $data = [
            'ARTICLE_ID' => $article['article_id'] ?? '',
            'TITLE'      => $article['title'] ?? '',
            'CONTENT'    => $article['content'] ?? '',
            'SLUG'       => $article['slug'] ?? '',
            'EXCERPT'    => $article['excerpt'] ?? ''
        ];

        echo $this->engine->render('postnews', $data);
    }
}