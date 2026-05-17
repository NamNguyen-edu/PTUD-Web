<?php

require_once __DIR__ . '/../Services/home_service.php';

class HomeController {

    private HomeService $homeService;

    public function __construct() {
        $this->homeService = new HomeService();
    }

    public function feed(): void {

        header('Content-Type: application/json; charset=utf-8');

        try {

            $page = isset($_GET['page'])
                ? (int) $_GET['page']
                : 1;

            $data = $this->homeService
                ->getHomepageFeed($page);

            echo json_encode([
                'success' => true,
                'data' => $data
            ]);

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
