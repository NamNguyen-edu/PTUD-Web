<?php
require_once __DIR__ . '/../Services/category_service.php';
require_once __DIR__ . '/../View/categoryview.php';

class CategoryController
{
    private CategoryTagModel $model;

    public function __construct()
    {
        $this->model = new CategoryTagModel();
    }

    public function render(): void
    {
        // 1. Gọi Model lấy dữ liệu từ Database lên trước
        $categories = $this->model->getAllCategories();
        $tags = $this->model->getAllTags();

        // 2. Khởi tạo View và truyền mảng dữ liệu vào để render HTML cứng
        $view = new CategoryView();
        echo $view->render($categories, $tags);
    }

    public function handleApi(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        $method = $_SERVER['REQUEST_METHOD'];
        $data = json_decode(file_get_contents("php://input"), true);

        try {
            switch ($method) {
                case 'GET':
                    // Vẫn giữ lại để nếu JS có cần gọi ngầm lấy data fresh thì dùng
                    $this->respond([
                        'status' => 'success',
                        'categories' => $this->model->getAllCategories(),
                        'tags' => $this->model->getAllTags()
                    ]);
                    break;
                case 'POST':
                    $id = $this->model->insert($data['type'], $data['name'], $data['slug']);
                    $this->respond(['status' => 'success', 'id' => $id]);
                    break;
                case 'PUT':
                    $this->model->update($data['type'], $data['id'], $data['name'], $data['slug']);
                    $this->respond(['status' => 'success']);
                    break;
                case 'DELETE':
                    $this->model->delete($data['type'], $data['id']);
                    $this->respond(['status' => 'success']);
                    break;
                default:
                    throw new Exception("Phương thức không hợp lệ.");
            }
        } catch (Exception $e) {
            $this->respond(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }

    private function respond(array $payload, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($payload);
        exit;
    }
}
