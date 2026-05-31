<?php

require_once __DIR__ . '/../Services/DashboardAdminService.php';

require_once __DIR__ . '/../View/ViewEngine.php';

class DashboardController
{
    private DashboardAdminService $service;

    public function __construct()
    {
        $this->service = new DashboardAdminService();
    }

    public function getDashboardData(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $data = $this->service->getDashboardData();
            echo json_encode($data);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => true, 'message' => $e->getMessage()]);
        }
    }

    public function render(): void
    {
        $engine = new ViewEngine();
        echo $engine->render('admin_dashboard');
    }
}
