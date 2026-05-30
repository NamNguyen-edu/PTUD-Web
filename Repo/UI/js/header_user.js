(function(){
    // 1. CUSTOM TOAST NOTIFICATION SYSTEM
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '3000';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        
        let emoji = 'ℹ️';
        if (type === 'success') emoji = '✅';
        else if (type === 'error') emoji = '❌';
        else if (type === 'warning') emoji = '⚠️';

        toast.innerHTML = `
            <span class="toast-icon">${emoji}</span>
            <div class="toast-body">${message}</div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Click to close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // Expose showToast globally
    window.showToast = showToast;

    // Overwrite browser alert
    window.alert = function(msg) {
        showToast(msg, 'info');
    };

    function getCurrentUserUrl() {
        const path = window.location.pathname || '';
        if (path.includes('/UI/html/') || path.includes('/UI/components/')) {
            return '../../index.php?page=get_current_user';
        }
        return '?page=get_current_user';
    }

    function getUpdateSettingsUrl() {
        const path = window.location.pathname || '';
        if (path.includes('/UI/html/') || path.includes('/UI/components/')) {
            return '../../index.php?page=update_settings';
        }
        return '?page=update_settings';
    }

    function applyTheme(theme) {
        const moonIcon = document.querySelector('#direct-theme-toggle .theme-icon-moon');
        const sunIcon = document.querySelector('#direct-theme-toggle .theme-icon-sun');
        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
            if (moonIcon) moonIcon.classList.add('d-none');
            if (sunIcon) sunIcon.classList.remove('d-none');
        } else {
            document.body.classList.remove('theme-dark');
            if (moonIcon) moonIcon.classList.remove('d-none');
            if (sunIcon) sunIcon.classList.add('d-none');
        }
    }

    function initHeaderUser() {
        const loginSection = document.getElementById('login-section');
        const profileSection = document.getElementById('profile-section');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const menuName = document.getElementById('profile-menu-name');
        const menuEmail = document.getElementById('profile-menu-email');
        const avatars = document.querySelectorAll('.profile-avatar img, .profile-menu-avatar img');


        const currentUserUrl = getCurrentUserUrl();
        const updateSettingsUrl = getUpdateSettingsUrl();
        let isUserLoggedIn = false;
        let currentUserId = null;

        // Fetch User and Settings
        fetch(currentUserUrl, {cache: 'no-store', credentials: 'same-origin'})
            .then(r => r.json())
            .then(data => {
                if (data && data.logged) {
                    isUserLoggedIn = true;
                    currentUserId = data.user.id;

                    loginSection?.classList.remove('d-flex');
                    loginSection?.classList.add('d-none');
                    profileSection?.classList.remove('d-none');
                    profileSection?.classList.add('d-flex');

                    const name = data.user.name || 'Người dùng';
                    const email = data.user.email || '';

                    if (profileName) profileName.textContent = name;
                    if (profileEmail) profileEmail.textContent = email;
                    if (menuName) menuName.textContent = name;
                    if (menuEmail) menuEmail.textContent = email;

                    const avatarUrl = (data.user && data.user.avatar_url) 
                        ? data.user.avatar_url 
                        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0d6efd&color=fff';
                    
                    avatars.forEach(img => img.src = avatarUrl);

                    // Apply Persisted Dark Mode from DB Settings
                    const dbSettings = data.user.settings;
                    if (dbSettings && dbSettings.theme) {
                        applyTheme(dbSettings.theme);
                        localStorage.setItem(`newsPulse_theme_user_${currentUserId}`, dbSettings.theme);
                    } else {
                        // Check if localStorage has it and sync to DB
                        const localTheme = localStorage.getItem(`newsPulse_theme_user_${currentUserId}`);
                        if (localTheme) {
                            applyTheme(localTheme);
                            syncThemeToDB(localTheme);
                        } else {
                            applyTheme('light'); // default light
                        }
                    }

                    const params = new URLSearchParams(window.location.search);
                    if (params.get('login_success') === '1') {
                        params.delete('login_success');
                        const newQuery = params.toString();
                        const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
                        window.history.replaceState(null, '', newUrl);
                        showToast(`Chào mừng ${name} quay trở lại!`, 'success');
                    }
                } else {
                    isUserLoggedIn = false;
                    loginSection?.classList.remove('d-none');
                    loginSection?.classList.add('d-flex');
                    profileSection?.classList.remove('d-flex');
                    profileSection?.classList.add('d-none');

                    // Apply Guest Session-based theme (sessionStorage)
                    const sessionTheme = sessionStorage.getItem('newsPulse_theme');
                    if (sessionTheme) {
                        applyTheme(sessionTheme);
                    } else {
                        applyTheme('light'); // Default to light mode for guests
                    }
                }
            }).catch((err)=>{
                console.warn('header_user: fetch failed', err);
                loginSection?.classList.remove('d-none');
                loginSection?.classList.add('d-flex');
                profileSection?.classList.add('d-none');
                
                // Guest fallback
                const sessionTheme = sessionStorage.getItem('newsPulse_theme');
                if (sessionTheme) {
                    applyTheme(sessionTheme);
                } else {
                    applyTheme('light');
                }
            });

        // Sync theme to DB helper
        function syncThemeToDB(theme) {
            fetch(updateSettingsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: { theme: theme } })
            });
        }

        // Toggling listener for premium direct header button
        const toggleBtn = document.getElementById('direct-theme-toggle');
        toggleBtn?.addEventListener('click', function() {
            const isDark = document.body.classList.contains('theme-dark');
            const targetTheme = isDark ? 'light' : 'dark';
            applyTheme(targetTheme);

            if (isUserLoggedIn && currentUserId) {
                // Persistent DB & localStorage save for logged in users
                localStorage.setItem(`newsPulse_theme_user_${currentUserId}`, targetTheme);
                syncThemeToDB(targetTheme);
            } else {
                // SessionStorage temporary save for guests
                sessionStorage.setItem('newsPulse_theme', targetTheme);
            }
        });

        // Redesigned Dropdown logic
        const profileInfo = document.querySelector('.profile-info');
        profileInfo?.addEventListener('click', function(e){
            e.stopPropagation();
            const container = document.querySelector('.profile-container');
            container?.classList.toggle('show-menu');
        });

        document.addEventListener('click', function(e) {
            const container = document.querySelector('.profile-container');
            const profileInfo = document.querySelector('.profile-info');
            if (container && profileInfo && !container.contains(e.target) && !profileInfo.contains(e.target)) {
                container.classList.remove('show-menu');
            }
        });

        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', function(e){
            e.preventDefault();
            window.location.href = currentUserUrl.includes('index.php') ? '../../index.php?page=logout' : '?page=logout';
        });
    }

    window.initHeaderUser = initHeaderUser;
    document.addEventListener('DOMContentLoaded', initHeaderUser);

})();