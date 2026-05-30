<?php
require_once __DIR__ . '/ViewEngine.php';

class AccountView
{
    private ViewEngine $engine;

    public function __construct(ViewEngine $engine = null)
    {
        $this->engine = $engine ?? new ViewEngine();
    }

    public function render(array $data = []): void
    {
        // Render file giao diện accoutnmanagement.html (Spelled exactly 'accoutnmanagement' in UI/html)
        echo $this->engine->render('accoutnmanagement', $data);
    }
  private ViewEngine $engine;

  public function __construct()
  {
    $this->engine = new ViewEngine(dirname(__DIR__));
  }

  public function render(array $data): void
  {
    $basePath = dirname(__DIR__);

    $sidebarHtml = @file_get_contents($basePath . '/UI/html/sidebar_admin.html') ?: '';
    $headerHtml  = @file_get_contents($basePath . '/UI/html/header_admin.html') ?: '';

    $users = $data['USERS'] ?? [];

    $initialRowsHtml = '';
    $initialPageUsers = array_slice($users, 0, 5);

    if (empty($initialPageUsers)) {
      $initialRowsHtml = '<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy dữ liệu.</td></tr>';
    } else {
      foreach ($initialPageUsers as $user) {
        $statusStr = isset($user['status']) ? strtolower($user['status']) : '';
        $statusBadge = match ($statusStr) {
          'active'  => '<span class="badge bg-success bg-opacity-10 text-success">Active</span>',
          'pending' => '<span class="badge bg-warning bg-opacity-10 text-warning">Pending</span>',
          default   => '<span class="badge bg-secondary bg-opacity-10 text-secondary">Suspended/Banned</span>',
        };

        $timeAgo = 'Never';
        if (!empty($user['lastActive']) && $user['lastActive'] !== 'Never' && $user['lastActive'] !== '0000-00-00 00:00:00') {
          $timePast = time() - strtotime($user['lastActive']);
          if ($timePast < 60) $timeAgo = 'Just now';
          elseif ($timePast < 3600) $timeAgo = floor($timePast / 60) . ' mins ago';
          elseif ($timePast < 86400) $timeAgo = floor($timePast / 3600) . ' hours ago';
          else $timeAgo = date('M d, Y', strtotime($user['lastActive']));
        }

        // Lấy tên hiển thị (Phòng hờ nếu DB bị null thì để chữ Vô danh)
        $displayName = !empty($user['name']) ? htmlspecialchars($user['name']) : 'Unknown User';

        // XỬ LÝ AVATAR ĐỘC LẬP BẰNG HTML/CSS (Không dùng API ngoài)
        if (!empty($user['avatar'])) {
          // Nếu có ảnh thật trong Database
          $avatarHtml = '<img src="' . htmlspecialchars($user['avatar']) . '" class="rounded-circle" width="36" height="36" alt="avatar">';
        } else {
          // Tự bóc tách 2 chữ cái đầu từ tên
          $words = explode(' ', trim($displayName));
          $initials = '';
          if (count($words) >= 2) {
            $initials = mb_substr($words[0], 0, 1) . mb_substr(end($words), 0, 1);
          } else {
            $initials = mb_substr($words[0], 0, 2);
          }
          $initials = strtoupper($initials);

          // Vẽ khối tròn chữ cái
          $avatarHtml = '<div class="avatar-letters">' . $initials . '</div>';
        }

        $initialRowsHtml .= '
            <tr>
                <td class="ps-4 align-middle">
                    <input class="form-check-input user-checkbox" type="checkbox" value="' . $user['id'] . '" onchange="evaluateCheckedCount()"/>
                </td>
                <td class="align-middle">
                    <div class="d-flex align-items-center gap-3">
                        ' . $avatarHtml . '
                        <div class="fw-bold text-dark mb-0">' . $displayName . '</div>
                    </div>
                </td>
                <td class="align-middle text-secondary small">' . htmlspecialchars($user['email']) . '</td>
                <td class="align-middle fw-medium text-dark text-capitalize">' . htmlspecialchars($user['role']) . '</td>
                <td class="align-middle">' . $statusBadge . '</td>
                <td class="align-middle text-secondary small">' . $timeAgo . '</td>
                <td class="text-end pe-4 align-middle">
                    <div class="dropdown">
                        <button class="btn btn-light btn-sm border-0 bg-transparent" data-bs-toggle="dropdown">
                            <span class="material-symbols-outlined fs-5">more_vert</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li><a class="dropdown-item small fw-bold" href="#" onclick="updateSingleStatus(' . $user['id'] . ', \'suspend\')">Suspend</a></li>
                            <li><a class="dropdown-item small text-danger fw-bold" href="#" onclick="deleteSingleUser(' . $user['id'] . ')">Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>';
      }
    }

    $jsonUsers = json_encode($users, JSON_UNESCAPED_UNICODE);

    echo $this->engine->render('AccountManagement', [
      'SIDEBAR_COMPONENT' => $sidebarHtml,
      'HEADER_COMPONENT'  => $headerHtml,
      'TITLE'             => $data['TITLE'] ?? 'Account Management',
      'ACCOUNT_ROWS'      => $initialRowsHtml,
      'JSON_USERS_DATA'   => "<script>window.__INITIAL_USERS__ = {$jsonUsers};</script>"
    ]);
  }
}
