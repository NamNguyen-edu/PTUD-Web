<?php

require_once __DIR__ . '/../Model/pdo.php';
function getAllUsers($keyword = '')
{
  if (!empty($keyword)) {
    $sql = "SELECT id, name, email, role, status, last_active AS lastActive 
                FROM users 
                WHERE name LIKE ? OR email LIKE ? OR role LIKE ? 
                ORDER BY id DESC";
    $searchParam = "%$keyword%";
    return pdo_query(
      $sql,
      $searchParam,
      $searchParam,
      $searchParam
    );
  } else {
    $sql = "SELECT id, name, email, avatar, role, status, last_active AS lastActive 
                FROM users 
                ORDER BY id DESC";
    return pdo_query($sql);
  }
}
function createUser($data)
{
  $name = isset($data['name'])
    ? trim($data['name']) : '';
  $email = isset($data['email']) ? trim($data['email']) : '';
  $role = isset($data['role']) ?
    trim($data['role']) : '';
  $status = isset($data['status']) ? trim($data['status']) : 'Active';
  if (
    empty($name) ||
    empty($email) || empty($role)
  ) {
    throw new Exception("Vui lòng điền đầy đủ thông tin bắt buộc.", 400);
  }
  $avatar = "https://i.pravatar.cc/150?u=" . urlencode(strtolower(str_replace(' ', '', $name)));
  $lastActive = ($status === ' Active') ? 'Just now' : (($status === 'Pending') ? 'Invited now' : 'Never');
  $sql = "INSERT INTO users (name, email, avatar, role, status, last_active) VALUES (?, ?, ?, ?, ?, ?)";
  pdo_execute($sql, $name, $email, $avatar, $role, $status, $lastActive);
  return true;
}
function deleteOneUser($id)
{
  if (!$id) {
    throw new Exception("Thiếu ID người dùng cần xóa.", 400);
  }
  $sql = "DELETE FROM users WHERE id = ?";
  pdo_execute($sql, $id);
  return true;
}
function handleBulkActions($data)
{
  $action = $data['action'];
  $ids = $data['ids'];
  if (empty($ids) || !is_array($ids)) {
    throw new Exception("Không có thành viên nào được chọn.", 400);
  }
  $idList = implode(',', array_map('intval', $ids));
  if ($action === 'delete') {
    $sql = "DELETE FROM users WHERE id IN ($idList)";
    pdo_execute($sql);
    return "Đã xóa thành công các thành viên được chọn!";
  } elseif ($action === 'suspend') {
    $sql = "UPDATE users SET status = 'Suspended' WHERE id IN ($idList)";
    pdo_execute($sql);
    return "Đã đình bản (Suspend) các thành viên được chọn!";
  } elseif ($action === 'invite') {
    $sql = "UPDATE users SET status = 'Pending', last_active = 'Invited now' WHERE id IN ($idList)";
    pdo_execute($sql);
    return "Đã gửi lại lời mời đến các thành viên được chọn!";
  }
  throw new Exception("Hành động không hợp lệ.", 400);
}
