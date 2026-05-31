<?php
require_once __DIR__ . '/../Services/account_service.php';
require_once __DIR__ . '/../View/accountview.php';

class AccountController
{
  private AccountService $model;

  public function __construct()
  {
    $this->model = new AccountService();
  }

  public function render(): void
  {
    $rawUsers = $this->model->getAllUsers();

    $mappedUsers = $this->formatUsersData($rawUsers);

    $view = new AccountView();
    $view->render([
      'TITLE' => 'Quản lý Người dùng',
      'USERS' => $mappedUsers
    ]);
  }

  public function handleApi(): void
  {
    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents("php://input"), true);

    try {
      $response = match ($method) {
        'GET'    => $this->processGet(),
        'POST'   => $this->processPost($data),
        default  => throw new Exception("Phương thức $method không được hỗ trợ"),
      };

      echo json_encode(array_merge(['success' => true], $response));
    } catch (Exception $e) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
  }

  private function processGet(): array
  {
    $keyword = trim((string)($_GET['search'] ?? ''));
    $rawUsers = ($keyword !== '') ? $this->model->searchUsers($keyword) : $this->model->getAllUsers();

    return ['data' => $this->formatUsersData($rawUsers)];
  }

  private function processPost(?array $input): array
  {
    $action = $input['action'] ?? 'create';

    return match ($action) {
      'create'  => $this->createUser($input),
      'delete'  => $this->deleteUsers($input['ids'] ?? []),
      'suspend' => $this->updateStatus($input['ids'] ?? [], 'suspended'),
      'active'  => $this->updateStatus($input['ids'] ?? [], 'active'),
      default   => throw new Exception("Hành động không hợp lệ."),
    };
  }

  private function createUser(array $data): array
  {
    if (empty($data['name']) || empty($data['email']) || empty($data['role']) || empty($data['status'])) {
      throw new Exception("Vui lòng điền đủ thông tin người dùng!");
    }
    $this->model->createUser($data);
    return ['message' => 'Tạo mới tài khoản thành công!'];
  }

  private function deleteUsers(array $ids): array
  {
    if (empty($ids)) throw new Exception("Danh sách ID xóa trống.");
    $this->model->deleteUsers($ids);
    return ['message' => 'Đã xóa các thành viên được chọn.'];
  }

  private function updateStatus(array $ids, string $status): array
  {
    if (empty($ids)) throw new Exception("Danh sách ID cập nhật trống.");
    $this->model->updateStatus($ids, $status);
    return ['message' => 'Cập nhật trạng thái tài khoản thành công.'];
  }

  private function formatUsersData(array $rawUsers): array
  {
    return array_map(function ($user) {
      return [
        'id'         => $user['user_id'],
        'name'       => $user['full_name'],
        'email'      => $user['email'],
        'role'       => $user['role_name'] ?? 'Contributor',
        'status'     => $user['status'],
        'lastActive' => $user['updated_at'] ?? 'Never',
        'avatar'     => $user['avatar_url'] ?? ''
      ];
    }, $rawUsers);
  }
}
