(function(){
    function initHeaderUser() {
        const loginSection = document.getElementById('login-section');
        const profileSection = document.getElementById('profile-section');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const menuName = document.getElementById('profile-menu-name');
        const menuEmail = document.getElementById('profile-menu-email');
        const avatars = document.querySelectorAll('.profile-avatar img, .profile-menu-avatar img');

        fetch('?action=get_current_user', {cache: 'no-store', credentials: 'same-origin'})
            .then(r => r.json())
            .then(data => {
                if (data && data.logged) {
                    loginSection?.classList.add('d-none');
                    profileSection?.classList.remove('d-none');
                    const name = data.user.name || 'Người dùng';
                    const email = data.user.email || '';
                    if (profileName) profileName.textContent = name;
                    if (profileEmail) profileEmail.textContent = email;
                    if (menuName) menuName.textContent = name;
                    if (menuEmail) menuEmail.textContent = email;
                    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0d6efd&color=fff';
                    avatars.forEach(img => img.src = avatarUrl);
                    console.log('Header user loaded successfully');

                    const params = new URLSearchParams(window.location.search);
                    if (params.get('login_success') === '1') {
                        console.log('Đăng nhập thành công');
                        params.delete('login_success');
                        const newQuery = params.toString();
                        const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
                        window.history.replaceState(null, '', newUrl);
                    }
                } else {
                    loginSection?.classList.remove('d-none');
                    profileSection?.classList.add('d-none');
                }
            }).catch((err)=>{
                console.warn('header_user: fetch failed', err);
                loginSection?.classList.remove('d-none');
                profileSection?.classList.add('d-none');
            });

        // Toggle dropdown
        const profileInfo = document.querySelector('.profile-info');
        profileInfo?.addEventListener('click', function(){
            const container = document.querySelector('.profile-container');
            container?.classList.toggle('show-menu');
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', function(e){
            e.preventDefault();
            window.location.href = '?action=logout';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeaderUser);
    } else {
        initHeaderUser();
    }
})();
