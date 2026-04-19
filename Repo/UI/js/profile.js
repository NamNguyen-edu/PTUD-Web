/**
 * NEWSPULSE PROFILE - CORE LOGIC (PHẦN 1/3)
 * Chức năng: Khởi tạo dữ liệu và điều khiển chuyển Tab
 * Naming Convention: camelCase
 */

// 1. GIẢ LẬP DỮ LIỆU NGƯỜI DÙNG (MOCK DATA)
const userData = {
    fullName: "Nguyễn Duy Bảo",
    email: "bebao2005at@gmai.com",
    major: "Business Information Systems",
    bio: "Nhà văn tự do, đam mê viết lách",
    stats: {
        posts: 24,
        bookmarks: 15,
        views: "8.2K"
    }
};

// 2. KHỞI TẠO KHI TRANG LOAD XONG
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
    // Kích hoạt tab tương ứng thông qua ID
    $(`#profileTab a[href="#${tabId}"]`).tab('show');
    
    // Cuộn nhẹ lên đầu nội dung tab trên mobile để dễ nhìn
    if (window.innerWidth < 992) {
        document.querySelector('.tab-content').scrollIntoView({ behavior: 'smooth' });
    }
}

// Lắng nghe sự kiện chuyển tab của Bootstrap để thực hiện hành động phụ
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    const targetTab = $(e.target).attr("href"); // Tab vừa hiện
    console.log("Switched to tab: " + targetTab);
    
    // Ví dụ: Nếu vào tab History thì mới load dữ liệu lịch sử để tối ưu hiệu năng
    if (targetTab === "#history") {
        renderHistoryList();
    }
});

// 4. LOAD DỮ LIỆU HỒ SƠ LÊN UI
function loadUserProfile() {
    // Cập nhật các chỉ số stats
    document.getElementById('statPosts').innerText = userData.stats.posts;
    document.getElementById('statBookmarks').innerText = userData.stats.bookmarks;
    document.getElementById('statViews').innerText = userData.stats.views;
    
    // Cập nhật thông tin trong form Settings
    const nameInput = document.getElementById('fullName');
    if (nameInput) nameInput.value = userData.fullName;
}

/**
 * HÀM XỬ LÝ ĐĂNG XUẤT
 */
function handleLogout() {
    const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất khỏi NewsPulse?");
    if (confirmLogout) {
        alert("Đang đăng xuất...");
        // Thực tế: Xóa token/session và redirect về trang chủ
        window.location.href = "index.html"; 
    }
}
/**
 * NEWSPULSE PROFILE - LOGIC SỞ THÍCH & LƯU TRỮ (PHẦN 2/3)
 * Chức năng: Xử lý Popup chọn chủ đề và quản lý bộ nhớ LocalStorage
 */

// 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP LẦN ĐẦU
function checkFirstTimeLogin() {
    // Kiểm tra xem trong record của user đã có dữ liệu sở thích chưa
    const hasPrefs = localStorage.getItem('newsPulse_UserPrefs');
    
    if (!hasPrefs) {
        console.log("First time login detected. Showing Preferences Modal...");
        // Delay 1 giây để user kịp nhìn thấy giao diện trước khi hiện Popup
        setTimeout(() => {
            $('#userPreferenceModal').modal('show');
        }, 1000);
    }
}

// 2. XỬ LÝ CHỌN TAG CHỦ ĐỀ TRONG POPUP
$(document).on('click', '.topic-tag', function() {
    // Cho phép chọn hoặc bỏ chọn bằng cách toggle class 'selected'
    $(this).toggleClass('selected');
    
    const selectedCount = $('.topic-tag.selected').length;
    console.log("Topics selected: " + selectedCount);
});

// 3. LƯU RECORD SỞ THÍCH VÀO BỘ NHỚ
function saveUserPreferences() {
    const selectedTags = [];
    $('.topic-tag.selected').each(function() {
        selectedTags.push($(this).data('topic'));
    });

    // Yêu cầu chọn ít nhất 2 chủ đề để tối ưu trải nghiệm
    if (selectedTags.length < 2) {
        alert("Bảo ơi, bạn hãy chọn ít nhất 2 chủ đề để NewsPulse có thể đề xuất tin tốt nhất nhé!");
        return;
    }

    // Tạo đối tượng record sở thích
    const prefRecord = {
        userId: "nguyenduybao_87",
        topics: selectedTags,
        updatedAt: new Date().toISOString()
    };

    // Lưu vào LocalStorage để giả lập lưu vào Database
    localStorage.setItem('newsPulse_UserPrefs', JSON.stringify(prefRecord));
    
    // Hiệu ứng hoàn thành
    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> ĐÃ LƯU THÀNH CÔNG';
    btn.classList.replace('btn-pulse-primary', 'btn-success');

    setTimeout(() => {
        $('#userPreferenceModal').modal('hide');
        alert("Tuyệt vời! Sở thích của bạn đã được ghi nhận. Hệ thống sẽ cá nhân hóa bảng tin ngay bây giờ.");
    }, 800);
}

// 4. XỬ LÝ LƯU THAY ĐỔI HỒ SƠ (TAB SETTINGS)
function saveProfileChanges() {
    const newName = document.getElementById('fullName').value;
    
    if (!newName.trim()) {
        alert("Tên không được để trống bạn nhé!");
        return;
    }

    // Cập nhật giả lập vào biến userData và UI
    userData.fullName = newName;
    document.querySelector('.nav-link .small.text-white').innerText = newName;
    document.querySelector('.profile-sidebar h4').innerText = newName;

    alert("✔️ Hồ sơ của Nguyễn Duy Bảo đã được cập nhật thành công!");
}

function resetForm() {
    if(confirm("Bạn muốn hủy bỏ các thay đổi vừa nhập?")) {
        loadUserProfile(); // Tải lại dữ liệu cũ từ biến userData
    }
}
/**
 * NEWSPULSE PROFILE - LOGIC TƯƠNG TÁC (PHẦN 3/3)
 * Chức năng: Render danh sách bài viết, quản lý lịch sử và các thao tác nhanh
 */

// 1. RENDER DANH SÁCH BÀI VIẾT TRONG TAB BOOKMARK
function renderBookmarkList() {
    const container = document.getElementById('bookmarkContainer');
    // Dữ liệu này có thể lấy từ LocalStorage hoặc API trong thực tế
    console.log("Rendering bookmarks for user: Nguyễn Duy Bảo");
}

// 2. XỬ LÝ TAB LỊCH SỬ ĐỌC BÀI (READING HISTORY)
function renderHistoryList() {
    const historyTimeline = document.querySelector('.history-timeline');
    // Hàm này được gọi từ sự kiện 'shown.bs.tab' ở Phần 1
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

// 3. XỬ LÝ HÀNH ĐỘNG NHANH (QUICK ACTIONS)
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

// 4. LOGIC ĐỔI ẢNH ĐẠI DIỆN (AVATAR)
document.querySelector('.btn-edit-avatar').addEventListener('click', function() {
    const newUrl = prompt("Nhập URL ảnh đại diện mới của bạn:", "https://ui-avatars.com/api/?name=Nguyen+Duy+Bao");
    if (newUrl) {
        document.querySelector('.avatar-wrapper img').src = newUrl;
        document.querySelector('.nav-item img').src = newUrl;
        alert("Cập nhật ảnh đại diện thành công!");
    }
});

// 5. ĐỒNG BỘ SLUG TỰ ĐỘNG (Dùng cho các bài đăng cũ)
function generateSlug(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * COMMIT RULES GHI NHỚ CHO BẢO:
 * 1. git add profile.html profile.css profile.js
 * 2. git commit -m "Creating new method - handleProfileManagement"
 * 3. git push origin Bao1
 */