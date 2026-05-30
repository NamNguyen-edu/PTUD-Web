<?php

require_once __DIR__ . '/../Model/pdo.php';

class AuthService
{
    public function findUserByLogin(string $login): ?array
{
    return pdo_query_one(
        'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
        $login,
        $login
    ) ?: null;
}
    public function existsUserByEmail(string $email): bool
    {
        return (bool) pdo_query_one('SELECT 1 FROM users WHERE email = ? LIMIT 1', $email);
    }

    public function verifyPassword(array $user, string $password): bool
    {
        $dbPassword = $user['password_hash'] ?? $user['password'] ?? '';

        if (empty($dbPassword)) {
            return false;
        }

        if (password_verify($password, $dbPassword)) {
            return true;
        }

        if (md5($password) === $dbPassword) {
            return true;
        }

        return $password === $dbPassword;
    }

    public function registerUser(string $fullname, string $emailOrPhone, string $password): int
    {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        return pdo_execute_return_last_id(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            $fullname,
            $emailOrPhone,
            $passwordHash
        );
    }
}
