(function () {
    /* =============================================
       1. CUSTOM TOAST NOTIFICATION SYSTEM (Hệ thống)
    ============================================= */
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
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            });
        }

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    // Expose showToast globally & Overwrite browser alert
    window.showToast = showToast;
    window.alert = function(msg) {
        showToast(msg, 'info');
    };

    /* =============================================
       2. UTILS (Bộ tiện ích URL và Giao diện)
    ============================================= */
    function getBaseUrl() {
        const path = window.location.pathname || '';
        const match = path.match(/^(.*\/Repo)(?:\/.*)?$/);
        return match ? `${match[1]}/index.php` : '/index.php';
    }

    function getUrl(page, params = {}) {
        const base = getBaseUrl();
        const q = new URLSearchParams({ page, ...params });
        return `${base}?${q.toString()}`;
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

    function timeAgo(isoString) {
        const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
        if (diff < 60)     return 'Vừa xong';
        if (diff < 3600)   return Math.floor(diff / 60) + ' phút trước';
        if (diff < 86400)  return Math.floor(diff / 3600) + ' giờ trước';
        return Math.floor(diff / 86400) + ' ngày trước';
    }

    /* =============================================
       3. NOTIFICATION STORE & UI (Chuông thông báo)
    ============================================= */
    const STORE_KEY = 'newsPulse_Notifications_History';
    const MAX_NOTIFS = 20;

    function loadNotifHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
        } catch (e) { return []; }
    }

    function saveNotifHistory(list) {
        localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFS)));
    }

    function addNotifToHistory(notif) {
        const list = loadNotifHistory();
        list.unshift(notif); // thêm vào đầu
        saveNotifHistory(list);
    }

    function updateBadge() {
        const list    = loadNotifHistory();
        const unread  = list.filter(n => !n.read).length;
        const badge   = document.getElementById('notif-badge');
        if (!badge) return;

        if (unread > 0) {
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.classList.remove('d-none');
            badge.style.display = 'flex';
        } else {
            badge.classList.add('d-none');
            badge.style.display = 'none';
        }
    }

    function renderNotifList() {
        const list      = loadNotifHistory();
        const container = document.getElementById('notif-list');
        const empty     = document.getElementById('notif-empty');
        if (!container) return;

        if (list.length === 0) {
            empty?.classList.remove('d-none');
            container.querySelectorAll('.notif-item').forEach(el => el.remove());
            return;
        }

        empty?.classList.add('d-none');
        container.querySelectorAll('.notif-item').forEach(el => el.remove());

        list.forEach((notif, idx) => {
            const icon = notif.type === 'article' ? '📰' : '💬';
            const bg   = notif.read ? 'white' : '#f0f6ff';
            const div  = document.createElement('div');
            div.className = 'notif-item';
            div.style.cssText = `
                display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6;
                cursor: pointer; background: ${bg}; transition: background 0.2s;
            `;
            div.innerHTML = `
                <div style="font-size: 1.3rem; flex-shrink: 0; margin-top: 2px;">${icon}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: ${notif.read ? '500' : '700'}; font-size: 0.82rem; color: #1e293b; line-height: 1.4; margin-bottom: 4px;">
                        ${notif.title}
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${notif.message}
                    </div>
                    <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px;">
                        ${timeAgo(notif.time)}
                    </div>
                </div>
                ${!notif.read ? `<div style="width: 8px; height: 8px; background: #0d6efd; border-radius: 50%; flex-shrink: 0; margin-top: 6px;"></div>` : ''}
            `;

            div.addEventListener('click', () => {
                const history = loadNotifHistory();
                history[idx].read = true;
                saveNotifHistory(history);
                updateBadge();
                renderNotifList();
                if (notif.link) window.location.href = notif.link;
            });

            div.addEventListener('mouseenter', () => div.style.background = '#f8fafc');
            div.addEventListener('mouseleave', () => div.style.background = notif.read ? 'white' : '#f0f6ff');
            container.appendChild(div);
        });
    }

    function initBell() {
        const wrapper  = document.getElementById('notif-bell-wrapper');
        const btn      = document.getElementById('notif-bell-btn');
        const dropdown = document.getElementById('notif-dropdown');
        const clearBtn = document.getElementById('notif-clear-btn');

        if (!wrapper || !btn || !dropdown) return;

        wrapper.classList.remove('d-none'); // Hiện chuông khi có user

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = !dropdown.classList.contains('d-none');
            if (isOpen) {
                dropdown.classList.add('d-none');
            } else {
                renderNotifList();
                dropdown.classList.remove('d-none');
                setTimeout(() => {
                    const history = loadNotifHistory();
                    history.forEach(n => n.read = true);
                    saveNotifHistory(history);
                    updateBadge();
                }, 2000);
            }
        });

        document.addEventListener('click', function (e) {
            if (!wrapper.contains(e.target)) dropdown.classList.add('d-none');
        });

        clearBtn?.addEventListener('click', function (e) {
            e.stopPropagation();
            saveNotifHistory([]);
            renderNotifList();
            updateBadge();
        });

        updateBadge();
    }

    /* =============================================
       4. NOTIFICATION POPUP (Đổi tên tránh xung đột Toast hệ thống)
    ============================================= */
    function showNotificationPopup(notif) {
        const container = document.getElementById('notif-container');
        if (!container) return;

        const icon = notif.type === 'article' ? '📰' : '💬';
        const id   = 'notif-toast-' + Date.now();

        const toast = document.createElement('div');
        toast.id = id;
        toast.style.cssText = `
            background: white; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            border-left: 4px solid ${notif.type === 'article' ? '#0d6efd' : '#22c55e'};
            padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;
            cursor: pointer; animation: slideInRight 0.3s ease; transition: opacity 0.3s ease;
        `;
        toast.innerHTML = `
            <div style="font-size: 1.4rem; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 0.85rem; color: #1e293b; margin-bottom: 4px;">
                    ${notif.title}
                </div>
                <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${notif.message}
                </div>
            </div>
            <button onclick="document.getElementById('${id}').remove()" style="background: none; border: none; color: #9ca3af; font-size: 1rem; cursor: pointer; flex-shrink: 0; padding: 0;">✕</button>
        `;

        toast.addEventListener('click', function (e) {
            if (e.target.tagName === 'BUTTON') return;
            if (notif.link) window.location.href = notif.link;
        });

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 6000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        #notif-bell-btn:hover { background: white !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        #notif-list::-webkit-scrollbar { width: 4px; }
        #notif-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    /* =============================================
       5. NOTIFICATION POLLING (Check thông báo ngầm)
    ============================================= */
    const POLL_INTERVAL = 30000;

    function getNotifPrefs() {
        try { return JSON.parse(localStorage.getItem('newsPulse_Notifications') || '{}'); } catch (e) { return {}; }
    }

    function getTopics() {
        try {
            const prefs = JSON.parse(localStorage.getItem('newsPulse_UserPrefs') || '{}');
            return Array.isArray(prefs.topics) ? prefs.topics.join(',') : '';
        } catch (e) { return ''; }
    }

    function pushNotif(notif) {
        addNotifToHistory(notif);
        updateBadge();
        showNotificationPopup(notif); // Đã dùng hàm mới
    }

    function initNotificationPolling() {
        if (!localStorage.getItem('newsPulse_LastArticleCheck')) localStorage.setItem('newsPulse_LastArticleCheck', new Date().toISOString());
        if (!localStorage.getItem('newsPulse_LastCommentCheck')) localStorage.setItem('newsPulse_LastCommentCheck', new Date().toISOString());

        setTimeout(pollNotifications, 5000);
        setInterval(pollNotifications, POLL_INTERVAL);
    }

    async function pollNotifications() {
        const prefs = getNotifPrefs();

        // Bài viết mới
        if (prefs.newArticle !== false) {
            const topics = getTopics();
            const since  = localStorage.getItem('newsPulse_LastArticleCheck') || '';
            if (topics) {
                try {
                    const res  = await fetch(getUrl('check_new_articles', { since, topics }), { credentials: 'same-origin' });
                    const data = await res.json();
                    if (data.count > 0) {
                        const first = data.items[0];
                        pushNotif({
                            type: 'article', title: 'Bài viết mới trong chủ đề yêu thích',
                            message: data.count > 1 ? `${first.title} và ${data.count - 1} bài viết khác` : first.title,
                            link: getUrl('article', { slug: first.slug }),
                            time: new Date().toISOString(), read: false
                        });
                    }
                    localStorage.setItem('newsPulse_LastArticleCheck', new Date().toISOString());
                } catch (e) { console.warn('Lỗi check bài viết:', e); }
            }
        }

        // Bình luận mới
        if (prefs.commentReply !== false) {
            const since = localStorage.getItem('newsPulse_LastCommentCheck') || '';
            try {
                const res  = await fetch(getUrl('check_new_comments', { since }), { credentials: 'same-origin' });
                const data = await res.json();
                if (data.count > 0) {
                    const first = data.items[0];
                    pushNotif({
                        type: 'comment', title: 'Bình luận mới',
                        message: data.count > 1 ? `${data.count} bình luận mới trên bài viết của bạn` : `Bình luận mới trên: ${first.article_title}`,
                        link: getUrl('article', { slug: first.article_slug }),
                        time: new Date().toISOString(), read: false
                    });
                }
                localStorage.setItem('newsPulse_LastCommentCheck', new Date().toISOString());
            } catch (e) { console.warn('Lỗi check bình luận:', e); }
        }
    }

    /* =============================================
       6. KHỞI TẠO HEADER (Lõi xử lý User)
    ============================================= */
    function initHeaderUser() {
        const loginSection   = document.getElementById('login-section');
        const profileSection = document.getElementById('profile-section');
        const profileName    = document.getElementById('profile-name');
        const profileEmail   = document.getElementById('profile-email');
        const menuName       = document.getElementById('profile-menu-name');
        const menuEmail      = document.getElementById('profile-menu-email');
        const avatars        = document.querySelectorAll('.profile-avatar img, .profile-menu-avatar img');

        let isUserLoggedIn = false;
        let currentUserId = null;

        fetch(getUrl('get_current_user'), { cache: 'no-store', credentials: 'same-origin' })
            .then(r => r.json())
            .then(data => {
                if (data && data.logged) {
                    isUserLoggedIn = true;
                    currentUserId = data.user.id;

                    loginSection?.classList.remove('d-flex');
                    loginSection?.classList.add('d-none');
                    profileSection?.classList.remove('d-none');
                    profileSection?.classList.add('d-flex');

                    const name  = data.user.name  || 'Người dùng';
                    const email = data.user.email || '';

                    if (profileName)  profileName.textContent  = name;
                    if (profileEmail) profileEmail.textContent = email;
                    if (menuName)     menuName.textContent     = name;
                    if (menuEmail)    menuEmail.textContent    = email;

                    const avatarUrl = (data.user && data.user.avatar_url) 
                        ? data.user.avatar_url 
                        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0d6efd&color=fff';
                    
                    avatars.forEach(img => img.src = avatarUrl);

                    // Xử lý Dark Mode cho User đã login
                    const dbSettings = data.user.settings;
                    if (dbSettings && dbSettings.theme) {
                        applyTheme(dbSettings.theme);
                        localStorage.setItem(`newsPulse_theme_user_${currentUserId}`, dbSettings.theme);
                    } else {
                        const localTheme = localStorage.getItem(`newsPulse_theme_user_${currentUserId}`);
                        if (localTheme) {
                            applyTheme(localTheme);
                            syncThemeToDB(localTheme);
                        } else {
                            applyTheme('light');
                        }
                    }

                    // Xử lý thông báo đăng nhập
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('login_success') === '1') {
                        params.delete('login_success');
                        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                        window.history.replaceState(null, '', newUrl);
                        showToast(`Chào mừng ${name} quay trở lại!`, 'success');
                    }

                    // Kích hoạt Thông báo
                    initBell();
                    initNotificationPolling();

                } else {
                    isUserLoggedIn = false;
                    loginSection?.classList.remove('d-none');
                    loginSection?.classList.add('d-flex');
                    profileSection?.classList.remove('d-flex');
                    profileSection?.classList.add('d-none');

                    // Giao diện cho Khách (Guest)
                    const sessionTheme = sessionStorage.getItem('newsPulse_theme');
                    if (sessionTheme) applyTheme(sessionTheme);
                    else applyTheme('light');
                }
            })
            .catch(err => {
                console.warn('Lỗi fetch header user:', err);
                loginSection?.classList.remove('d-none');
                loginSection?.classList.add('d-flex');
                profileSection?.classList.add('d-none');
                
                const sessionTheme = sessionStorage.getItem('newsPulse_theme');
                if (sessionTheme) applyTheme(sessionTheme);
                else applyTheme('light');
            });

        // Hàm đồng bộ Theme lên DB
        function syncThemeToDB(theme) {
            fetch(getUrl('update_settings'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: { theme: theme } })
            });
        }

        // Nút bấm thay đổi giao diện (Dark/Light)
        const toggleBtn = document.getElementById('direct-theme-toggle');
        toggleBtn?.addEventListener('click', function() {
            const isDark = document.body.classList.contains('theme-dark');
            const targetTheme = isDark ? 'light' : 'dark';
            applyTheme(targetTheme);

            if (isUserLoggedIn && currentUserId) {
                localStorage.setItem(`newsPulse_theme_user_${currentUserId}`, targetTheme);
                syncThemeToDB(targetTheme);
            } else {
                sessionStorage.setItem('newsPulse_theme', targetTheme);
            }
        });

        // ==========================================
        // SỬ DỤNG EVENT DELEGATION CHO MENU HỒ SƠ 
        // Đảm bảo chạy mượt trên MỌI trang, kể cả article.html
        // ==========================================
        document.addEventListener('click', function(e) {
            const profileBtn = e.target.closest('.profile-info');
            const profileContainer = document.querySelector('.profile-container');
            
            if (profileBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (profileContainer) profileContainer.classList.toggle('show-menu');
            } else if (profileContainer && !profileContainer.contains(e.target)) {
                profileContainer.classList.remove('show-menu');
            }
        });

        // Nút Đăng xuất
        document.getElementById('logout-btn')?.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = getUrl('logout');
        });
    }

    /* =============================================
       7. KÍCH HOẠT HỆ THỐNG KHI TẢI TRANG
    ============================================= */
    window.initHeaderUser = initHeaderUser;

    document.addEventListener('DOMContentLoaded', initHeaderUser);

})();