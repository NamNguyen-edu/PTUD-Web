document.addEventListener("DOMContentLoaded", function() {
    // Header Load
    loadComponent("header-placeholder", "../components/header.html");
    
    // Footer Load
    loadComponent("footer-placeholder", "../components/footer.html");

    // Initialize auth UI after components load
    setTimeout(initAuthUI, 100);
});

function loadComponent(id, path) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    fetch(path)
        .then(response => {
            if (!response.ok) throw new Error("Missing file: " + path);
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
            // Re-initialize auth listeners sau khi load component
            if (id === "header-placeholder") {
                setupAuthEventListeners();
            }
        })
        .catch(err => console.warn(err));
}

// ===== AUTH UI MANAGEMENT =====
function initAuthUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'Người dùng';
    
    updateAuthUI(isLoggedIn, userName);
}

function updateAuthUI(isLoggedIn, userName = 'Người dùng') {
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileMenuName = document.getElementById('profile-menu-name');
    const profileMenuEmail = document.getElementById('profile-menu-email');

    if (!loginSection || !profileSection) return;

    if (isLoggedIn) {
        loginSection.classList.add('d-none');
        profileSection.classList.remove('d-none');
        if (profileName) profileName.textContent = userName;
        if (profileEmail) profileEmail.textContent = userName;
        if (profileMenuName) profileMenuName.textContent = userName;
        if (profileMenuEmail) profileMenuEmail.textContent = userName;
    } else {
        loginSection.classList.remove('d-none');
        profileSection.classList.add('d-none');
    }
}

function setupAuthEventListeners() {
    // Remove old listeners to avoid duplicates
    document.removeEventListener('click', handleProfileMenuClose);
    
    // Profile info click to toggle menu (with slight delay to ensure DOM is ready)
    setTimeout(() => {
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            // Remove old click listener
            profileInfo.replaceWith(profileInfo.cloneNode(true));
            
            // Add new click listener
            const newProfileInfo = document.querySelector('.profile-info');
            if (newProfileInfo) {
                newProfileInfo.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const container = this.closest('.profile-container');
                    if (container) {
                        container.classList.toggle('show-menu');
                    }
                });
            }
        }

        // Close menu when clicking outside
        document.addEventListener('click', handleProfileMenuClose);

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    }, 50);
}

function handleProfileMenuClose(e) {
    const profileContainer = document.querySelector('.profile-container');
    const profileInfo = document.querySelector('.profile-info');
    
    if (profileContainer && !profileContainer.contains(e.target)) {
        profileContainer.classList.remove('show-menu');
    }
}

// ===== PUBLIC API FOR BACKEND =====
// Gọi hàm này khi login thành công từ backend
function login(userName) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', userName);
    updateAuthUI(true, userName);
    setupAuthEventListeners();
}

// Gọi hàm này để logout
function logout() {
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.classList.remove('show-menu');
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    updateAuthUI(false);
    alert('Đã đăng xuất!');
}