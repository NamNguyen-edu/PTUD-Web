<?php

require_once __DIR__ . '/../Services/profile_service.php';
require_once __DIR__ . '/../View/ProfileView.php';

class ProfileController
{
    public function show(): void
    {
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;

        $profileService = new ProfileService();
        $userInfo = $profileService->getUserInfo($userId);
        $userArticles = $profileService->getUserArticles($userId);

        $view = new ProfileView();
        $view->render($userInfo, $userArticles);
    }
}
