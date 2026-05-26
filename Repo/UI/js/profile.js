// MODULE TỰ ĐỘNG LOAD COMPONENT (HEADER/FOOTER)
document.addEventListener("DOMContentLoaded", function() {
    // Tải Header
    fetch("../components/header.html")
        .then(response => {
            if (!response.ok) throw new Error("Không thể load header");
            return response.text();
        })
        .then(data => {
            document.getElementById("header-placeholder").innerHTML = data;

            const headerScript = document.createElement('script');
            headerScript.src = '../js/header_user.js';
            headerScript.defer = true;
            document.head.appendChild(headerScript);

            // 1. Ẩn nút Đăng nhập / Đăng ký
            document.getElementById("login-section").classList.add("d-none");
            
            // 2. Bật khu vực Profile lên
            document.getElementById("profile-section").classList.remove("d-none");
            document.getElementById("profile-section").classList.add("d-flex"); 
            
            // 3. Đổi tên và email cho trang cá nhân
            document.getElementById("profile-name").innerText = userData.fullName;
            document.getElementById("profile-menu-name").innerText = userData.fullName;
            document.getElementById("profile-email").innerText = userData.major;
            document.getElementById("profile-menu-email").innerText = userData.email;

            // 4. Xử lý click xổ menu mượt mà
            const profileBtn = document.querySelector('.profile-info');
            const profileMenu = document.querySelector('.profile-menu');

            profileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                profileMenu.classList.toggle('d-block');
            });

            document.addEventListener('click', function(e) {
                if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                    profileMenu.classList.remove('d-block');
                }
            });
        })
        .catch(err => console.error(err));

    // Tải Footer
    fetch("../components/footer.html")
        .then(response => {
            if (!response.ok) throw new Error("Không thể load footer");
            return response.text();
        })
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;
        })
        .catch(err => console.error(err));
});


// 1. GIẢ LẬP DỮ LIỆU NGƯỜI DÙNG CÓ LƯU TRỮ LOCALSTORAGE
const defaultUserData = {
    fullName: "Nguyễn Duy Bảo",
    email: "bebao2005at@gmail.com",
    major: "Business Information Systems",
    bio: "Nhà văn tự do, đam mê viết lách",
    stats: {
        posts: 24,
        bookmarks: 15,
        views: "8.2K"
    }
};

// Kiểm tra xem trong máy đã lưu thông tin sửa đổi chưa, nếu chưa thì xài mặc định
let userData = JSON.parse(localStorage.getItem('newsPulse_UserData')) || defaultUserData;
// 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
document.addEventListener('DOMContentLoaded', function() {
    console.log("⚡ NewsPulse Profile System Ready!");
    
    // Kiểm tra xem có phải lần đầu đăng nhập không để hiện Popup Preference
    checkFirstTimeLogin();
    
    // Load dữ liệu lên giao diện
    loadUserProfile();
    
    // Khởi tạo các tooltips của Bootstrap nếu cần
    $('[data-toggle="tooltip"]').tooltip();
});

// 3. LOGIC CHUYỂN TAB (SỬ DỤNG BOOTSTRAP TABS KẾT HỢP CUSTOM LOGIC)
function switchTab(tabId) {
    $(`#profileTab a[href="#${tabId}"]`).tab('show');
    
    if (window.innerWidth < 992) {
        document.querySelector('.tab-content').scrollIntoView({ behavior: 'smooth' });
    }
}

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    const targetTab = $(e.target).attr("href"); 
    console.log("Switched to tab: " + targetTab);
    
    if (targetTab === "#history") {
        renderHistoryList();
    }
});

// 4. LOAD DỮ LIỆU HỒ SƠ LÊN UI (Phủ dữ liệu lên mọi ngóc ngách)
function loadUserProfile() {
    // 1. Cập nhật thống kê
    document.getElementById('statPosts').innerText = userData.stats.posts;
    document.getElementById('statBookmarks').innerText = userData.stats.bookmarks;
    document.getElementById('statViews').innerText = userData.stats.views;
    
    // 2. Đổ dữ liệu vào Form Chỉnh sửa
    const nameInput = document.getElementById('fullName');
    const majorInput = document.getElementById('majorInput');
    const bioInput = document.getElementById('bioInput');
    
    if (nameInput) nameInput.value = userData.fullName;
    if (majorInput) majorInput.value = userData.major;
    if (bioInput) bioInput.value = userData.bio;

    // 3. Đổ dữ liệu ra Cột Sidebar bên trái
    const sidebarName = document.querySelector('.profile-sidebar h4');
    const sidebarBio = document.querySelector('.profile-bio p');
    const sidebarMajor = document.querySelector('.profile-sidebar p.text-muted');

    if (sidebarName) sidebarName.innerText = userData.fullName;
    if (sidebarBio) sidebarBio.innerText = `"${userData.bio}"`;
    if (sidebarMajor) sidebarMajor.innerText = userData.major;

    // 4. Đổ dữ liệu lên tên ở thanh Navbar riêng của trang Profile
    const profileNavName = document.querySelector('.navbar-nav .nav-item.active .text-white.small');
    if (profileNavName) profileNavName.innerText = userData.fullName;
}

// 5. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP LẦN ĐẦU
function checkFirstTimeLogin() {
    const hasPrefs = localStorage.getItem('newsPulse_UserPrefs');
    
    if (!hasPrefs) {
        console.log("First time login detected. Showing Preferences Modal...");
        setTimeout(() => {
            $('#userPreferenceModal').modal('show');
        }, 1000);
    }
}

// 6. XỬ LÝ CHỌN TAG CHỦ ĐỀ TRONG POPUP
$(document).on('click', '.topic-tag', function() {
    $(this).toggleClass('selected');
    const selectedCount = $('.topic-tag.selected').length;
    console.log("Topics selected: " + selectedCount);
});

function saveUserPreferences() {
    const selectedTags = [];
    $('.topic-tag.selected').each(function() {
        selectedTags.push($(this).data('topic'));
    });

    if (selectedTags.length < 2) {
        alert("Bảo ơi, bạn hãy chọn ít nhất 2 chủ đề để NewsPulse có thể đề xuất tin tốt nhất nhé!");
        return;
    }

    const prefRecord = {
        userId: "nguyenduybao_87",
        topics: selectedTags,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('newsPulse_UserPrefs', JSON.stringify(prefRecord));
    
    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> ĐÃ LƯU THÀNH CÔNG';
    btn.classList.replace('btn-pulse-primary', 'btn-success');

    setTimeout(() => {
        $('#userPreferenceModal').modal('hide');
        alert("Tuyệt vời! Sở thích của bạn đã được ghi nhận. Hệ thống sẽ cá nhân hóa bảng tin ngay bây giờ.");
    }, 800);
}

// 7. XỬ LÝ LƯU THAY ĐỔI HỒ SƠ (TAB SETTINGS)
function saveProfileChanges() {
    // Lấy dữ liệu mới từ các ô input
    const newName = document.getElementById('fullName').value;
    const newMajor = document.getElementById('majorInput').value;
    const newBio = document.getElementById('bioInput').value;
    
    if (!newName.trim()) {
        alert("Tên không được để trống bạn nhé!");
        return;
    }

    // Cập nhật dữ liệu vào biến
    userData.fullName = newName;
    userData.major = newMajor;
    userData.bio = newBio;

    // LƯU CHẶT VÀO Ổ CỨNG TRÌNH DUYỆT
    localStorage.setItem('newsPulse_UserData', JSON.stringify(userData));

    alert("✔️ Hồ sơ của bạn đã được cập nhật thành công!");
    
    // Ép trình duyệt tự động F5 lại trang để hàm loadUserProfile() chạy và đắp giao diện mới lên
    window.location.reload(); 
}

// 8. RENDER DANH SÁCH BÀI VIẾT TRONG TAB BOOKMARK
function renderBookmarkList() {
    const container = document.getElementById('bookmarkContainer');
    console.log("Rendering bookmarks for user: Nguyễn Duy Bảo");
}

function renderHistoryList() {
    const historyTimeline = document.querySelector('.history-timeline');
    console.log("History timeline updated.");
}

function clearHistory() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc bài không?")) {
        const timeline = document.querySelector('.history-timeline');
        timeline.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-history fa-3x text-light mb-3"></i>
                <p class="text-muted">Lịch sử đọc bài trống.</p>
            </div>
        `;
        alert("Đã xóa lịch sử thành công!");
    }
}

function handleQuickAction(action) {
    switch(action) {
        case 'editProfile':
            switchTab('settings');
            break;
        case 'viewNightOwl':
            alert("Đang chuyển hướng đến chi tiết dự án NightOwl Market...");
            break;
        case 'checkResearch':
            alert("Đang mở tài liệu nghiên cứu Churn Prediction (SHAP/LIME)...");
            break;
        default:
            console.log("Action: " + action);
    }
}

// 9. LOGIC ĐỔI ẢNH ĐẠI DIỆN (AVATAR)
document.querySelector('.btn-edit-avatar').addEventListener('click', function() {
    const newUrl = prompt("Nhập URL ảnh đại diện mới của bạn:", "https://ui-avatars.com/api/?name=Nguyen+Duy+Bao");
    if (newUrl) {
        document.querySelector('.avatar-wrapper img').src = newUrl;
        
        // Thay đổi avatar trên header component
        const headerAvatars = document.querySelectorAll('.profile-avatar img, .profile-menu-avatar img');
        headerAvatars.forEach(img => img.src = newUrl);
        
        alert("Cập nhật ảnh đại diện thành công!");
    }
});

function generateSlug(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}