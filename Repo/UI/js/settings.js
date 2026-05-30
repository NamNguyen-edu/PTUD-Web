/* =============================================
   SETTINGS.JS
============================================= */

function getAppUrl(query) {
    const path = window.location.pathname;
    const match = path.match(/^(.*\/Repo)(?:\/.*)?$/);
    const base = match ? `${match[1]}/index.php` : '/index.php';
    return `${base}${query.startsWith('?') ? query : '?' + query}`;
}

/* =============================================
   SIDEBAR NAVIGATION
============================================= */
function initSidebarNav() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Active nav
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');

            // Show section
            const targetId = this.dataset.section;
            sections.forEach(s => s.classList.add('d-none'));
            document.getElementById(targetId)?.classList.remove('d-none');
        });
    });
}

/* =============================================
   TOGGLE PASSWORD VISIBILITY
============================================= */
function initTogglePassword() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? '🙈' : '👁';
        });
    });
}

/* =============================================
   PASSWORD STRENGTH INDICATOR
============================================= */
function initPasswordStrength() {
    const newPasswordInput = document.getElementById('new_password');
    const strengthBar      = document.getElementById('strength-bar');
    const strengthText     = document.getElementById('strength-text');
    const strengthWrapper  = document.getElementById('password-strength');

    if (!newPasswordInput) return;

    newPasswordInput.addEventListener('input', function () {
        const val = this.value;

        if (val.length === 0) {
            strengthWrapper.classList.add('d-none');
            return;
        }

        strengthWrapper.classList.remove('d-none');

        let score = 0;
        if (val.length >= 6)                        score++;
        if (val.length >= 10)                       score++;
        if (/[A-Z]/.test(val))                      score++;
        if (/[0-9]/.test(val))                      score++;
        if (/[^A-Za-z0-9]/.test(val))               score++;

        const levels = [
            { width: '20%', color: '#ef4444', label: 'Rất yếu' },
            { width: '40%', color: '#f97316', label: 'Yếu' },
            { width: '60%', color: '#eab308', label: 'Trung bình' },
            { width: '80%', color: '#22c55e', label: 'Mạnh' },
            { width: '100%', color: '#16a34a', label: 'Rất mạnh' },
        ];

        const level = levels[Math.min(score - 1, 4)] || levels[0];
        strengthBar.style.width           = level.width;
        strengthBar.style.backgroundColor = level.color;
        strengthText.textContent          = level.label;
        strengthText.style.color          = level.color;
    });
}

/* =============================================
   ĐỔI MẬT KHẨU
============================================= */
function initChangePassword() {
    const btn     = document.getElementById('btn-change-password');
    const alertEl = document.getElementById('password-alert');

    if (!btn) return;

    function showAlert(message, type = 'danger') {
        alertEl.className = `alert alert-${type} mt-3`;
        alertEl.textContent = message;
        alertEl.classList.remove('d-none');
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'success') {
            setTimeout(() => alertEl.classList.add('d-none'), 4000);
        }
    }

    btn.addEventListener('click', async function () {
        const currentPassword = document.getElementById('current_password').value.trim();
        const newPassword     = document.getElementById('new_password').value.trim();
        const confirmPassword = document.getElementById('confirm_password').value.trim();

        // Validate phía client
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Vui lòng điền đầy đủ tất cả các trường.');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Mật khẩu xác nhận không khớp.');
            return;
        }

        // Gửi request
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        try {
            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            formData.append('confirm_password', confirmPassword);

            const res  = await fetch(getAppUrl('?page=change_password'), {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                showAlert(data.message, 'success');
                // Clear các input
                document.getElementById('current_password').value = '';
                document.getElementById('new_password').value     = '';
                document.getElementById('confirm_password').value = '';
                document.getElementById('password-strength').classList.add('d-none');
            } else {
                showAlert(data.message);
            }
        } catch (err) {
            showAlert('Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Cập nhật mật khẩu';
        }
    });
}

/* =============================================
   THÔNG BÁO (localStorage)
============================================= */
function initNotifications() {
    const btn       = document.getElementById('btn-save-notifications');
    const savedText = document.getElementById('notif-saved');

    if (!btn) return;

    // Load trạng thái đã lưu
    const saved = JSON.parse(localStorage.getItem('newsPulse_Notifications') || '{}');
    if (saved.newArticle  !== undefined) document.getElementById('notif-new-article').checked  = saved.newArticle;
    if (saved.commentReply !== undefined) document.getElementById('notif-comment-reply').checked = saved.commentReply;
    if (saved.weekly      !== undefined) document.getElementById('notif-weekly').checked       = saved.weekly;

    btn.addEventListener('click', function () {
        const prefs = {
            newArticle:   document.getElementById('notif-new-article').checked,
            commentReply: document.getElementById('notif-comment-reply').checked,
            weekly:       document.getElementById('notif-weekly').checked,
        };

        localStorage.setItem('newsPulse_Notifications', JSON.stringify(prefs));

        savedText.classList.remove('d-none');
        setTimeout(() => savedText.classList.add('d-none'), 3000);
    });
}

/* =============================================
   CHỦ ĐỀ YÊU THÍCH (localStorage)
============================================= */
function initTopicPreferences() {
    const btn       = document.getElementById('btn-save-preferences');
    const savedText = document.getElementById('pref-saved');
    const chips     = document.querySelectorAll('.topic-chip');

    if (!btn) return;

    // Load topics đã lưu từ newsPulse_UserPrefs (dùng chung với home.js)
    try {
        const saved = JSON.parse(localStorage.getItem('newsPulse_UserPrefs') || '{}');
        const savedTopics = Array.isArray(saved.topics) ? saved.topics : [];

        chips.forEach(chip => {
            if (savedTopics.includes(chip.dataset.topic)) {
                chip.classList.add('selected');
            }
        });
    } catch (e) {}

    // Toggle chip
    chips.forEach(chip => {
        chip.addEventListener('click', function () {
            this.classList.toggle('selected');
        });
    });

    // Lưu
    btn.addEventListener('click', function () {
        const selectedTopics = [];
        chips.forEach(chip => {
            if (chip.classList.contains('selected')) {
                selectedTopics.push(chip.dataset.topic);
            }
        });

        const prefs = { topics: selectedTopics };
        localStorage.setItem('newsPulse_UserPrefs', JSON.stringify(prefs));

        savedText.classList.remove('d-none');
        setTimeout(() => savedText.classList.add('d-none'), 3000);
    });
}

/* =============================================
   INITIALIZE
============================================= */
document.addEventListener('DOMContentLoaded', function () {
    initSidebarNav();
    initTogglePassword();
    initPasswordStrength();
    initChangePassword();
    initNotifications();
    initTopicPreferences();
});