// MODULE TỰ ĐỘNG LOAD COMPONENT (HEADER/FOOTER)

// 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
document.addEventListener("DOMContentLoaded", function() {
    const BASE = "/PTUD-Web/Repo/UI";

    // Tải Header
    fetch(BASE + "/components/header.html")
        .then(response => {
            if (!response.ok) throw new Error("Không thể load header");
            return response.text();
        })
        .then(data => {
            const el = document.getElementById("header-placeholder");
            if (!el) return;
            el.innerHTML = data;

            const headerScript = document.createElement('script');
            headerScript.src = BASE + '/js/header_user.js';
            headerScript.defer = true;
            headerScript.onload = function() {
                if (window.initHeaderUser) window.initHeaderUser();
            };
            document.head.appendChild(headerScript);

            const loginSection = document.getElementById("login-section");
            const profileSection = document.getElementById("profile-section");
            if (loginSection) loginSection.classList.add("d-none");
            if (profileSection) {
                profileSection.classList.remove("d-none");
                profileSection.classList.add("d-flex");
            }

            const realName = document.querySelector('.profile-sidebar h4')?.innerText || 'Biên tập viên';
            const profileName = document.getElementById("profile-name");
            const profileMenuName = document.getElementById("profile-menu-name");
            if (profileName) profileName.innerText = realName;
            if (profileMenuName) profileMenuName.innerText = realName;

            const profileBtn = document.querySelector('.profile-info');
            const profileMenu = document.querySelector('.profile-menu');
            if (profileBtn && profileMenu) {
                profileBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    profileMenu.classList.toggle('d-block');
                });
                document.addEventListener('click', function(e) {
                    if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                        profileMenu.classList.remove('d-block');
                    }
                });
            }
        })
        .catch(err => console.error(err));

    // Tải Footer
    fetch(BASE + "/components/footer.html")
        .then(response => {
            if (!response.ok) throw new Error("Không thể load footer");
            return response.text();
        })
        .then(data => {
            const el = document.getElementById("footer-placeholder");
            if (!el) return;
            el.innerHTML = data;
        })
        .catch(err => console.error(err));

    // Skills
    const hiddenSkillsInput = document.getElementById('hiddenSkills');
    if (hiddenSkillsInput && hiddenSkillsInput.value && hiddenSkillsInput.value !== '{{SKILLS_JSON}}') {
        try {
            userSkills = JSON.parse(hiddenSkillsInput.value);
            renderSkills();
        } catch(e) {
            console.error("Lỗi parse JSON kỹ năng:", e);
        }
            checkFirstTimeLogin();
    checkArticleAlerts();
    }
    function checkArticleAlerts() {
    const el = document.getElementById('alertArticlesData');
    if (!el || !el.value || el.value === '{{ALERT_ARTICLES_JSON}}') return;

    let articles = [];
    try { articles = JSON.parse(el.value); } catch(e) { return; }
    if (!articles.length) return;

    // Build danh sách bài cần xử lý
    const statusMap = {
        'revision':  { label: 'Cần sửa lại', cls: 'warning',  icon: 'fa-edit' },
        'rejected':  { label: 'Bị từ chối',  cls: 'danger',   icon: 'fa-times-circle' }
    };

// 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
document.addEventListener('DOMContentLoaded', function() {
    
    
    // Kiểm tra xem có phải lần đầu đăng nhập không để hiện Popup Preference
    checkFirstTimeLogin();
    loadReadingHistory();
    // Load dữ liệu lên giao diện    
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
    
    
    if (targetTab === "#history") {
        renderHistoryList();
    }
});


// 5. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP LẦN ĐẦU
function checkFirstTimeLogin() {
    const hasPrefs = localStorage.getItem('newsPulse_UserPrefs');
    
    if (!hasPrefs) {
        
        setTimeout(() => {
            $('#userPreferenceModal').modal('show');
        }, 1000);
    }
}

// 6. XỬ LÝ CHỌN TAG CHỦ ĐỀ TRONG POPUP
$(document).on('click', '.topic-tag', function() {
    $(this).toggleClass('selected');
    const selectedCount = $('.topic-tag.selected').length;
    
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
    const fullNameInput = document.getElementById('fullName');
    const bioInput = document.getElementById('bioInput');
    
    const newName = fullNameInput.value.trim();
    const newBio = bioInput ? bioInput.value.trim() : '';
    
    // Ràng buộc (Validation) Frontend
    if (!newName) {
        fullNameInput.classList.add('is-invalid'); // Hiện viền đỏ của Bootstrap
        alert("Họ và tên không được để trống bạn nhé!");
        fullNameInput.focus();
        return;
    } else {
        fullNameInput.classList.remove('is-invalid');
    }

    // Đổi trạng thái nút bấm tránh user spam click
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ĐANG LƯU...';
    btn.disabled = true;

    // Chuẩn bị dữ liệu gửi đi
    const formData = new FormData();
    formData.append('full_name', newName);
    formData.append('bio', newBio);
    formData.append('skills', JSON.stringify(userSkills));

    // Bắn AJAX qua Fetch API
    fetch('?page=update_profile', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        // Phục hồi nút bấm
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (data.success) {
            alert("✔️ Hồ sơ của bạn đã được cập nhật thành công!");
            
            // Cập nhật ngay lập tức các UI khác trên trang (Real-time DOM update)
            const sidebarName = document.querySelector('.profile-sidebar h4');
            const sidebarBio = document.querySelector('.profile-bio p');
            const headerName1 = document.getElementById('profile-name');
            const headerName2 = document.getElementById('profile-menu-name');

            if (sidebarName) sidebarName.innerText = newName;
            if (sidebarBio) sidebarBio.innerText = `"${newBio}"`;
            if (headerName1) headerName1.innerText = newName;
            if (headerName2) headerName2.innerText = newName;
            
        } else {
            alert(data.message || "Có lỗi xảy ra khi lưu!");
        }
    })
    .catch(err => {
        console.error(err);
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert("Lỗi kết nối đến máy chủ.");
    });
}

// 8. RENDER DANH SÁCH BÀI VIẾT TRONG TAB BOOKMARK
function renderBookmarkList() {
    const container = document.getElementById('bookmarkContainer');
    
}

function renderHistoryList() {
    const historyTimeline = document.querySelector('.history-timeline');
    
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

async function loadReadingHistory() {

    try {

        const response =
            await fetch('?page=get_reading_history');

        const result =
            await response.json();

        if (!result.success) {
            return;
        }

        const container =
            document.getElementById(
                'reading-history-container'
            );

        if (!container) return;

        if (!result.data.length) {

            container.innerHTML = `
                <div class="text-muted">
                    Chưa có lịch sử đọc
                </div>
            `;
            return;
        }
        container.innerHTML =
            result.data.map(item => {

                return `
                    <div
                        class="history-item d-flex align-items-center p-3 mb-3 bg-white rounded shadow-sm border-left-pulse"
                        onclick="window.location.href='?page=article&slug=${item.slug}'"
                        style="cursor:pointer;"
                    >

                        <img
                            src="${item.thumbnail_url || 'https://picsum.photos/100'}"
                            style="
                                width:80px;
                                height:80px;
                                object-fit:cover;
                                border-radius:10px;
                                margin-right:16px;
                            "
                        >

                        <div class="history-info flex-grow-1">

                            <h6 class="mb-1 font-weight-bold">
                                ${item.title}
                            </h6>

                            <small class="text-muted">
                                Đã đọc ${item.read_count} lần
                            </small>

                            <br>

                            <small class="text-muted">
                                ${new Date(item.last_read_at)
                                    .toLocaleString('vi-VN')}
                            </small>

                        </div>

                    </div>
                `;
            }).join('');

    } catch (err) {

        console.error(err);
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
            
    }
}

// 9. LOGIC ĐỔI ẢNH ĐẠI DIỆN (AVATAR)


function generateSlug(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// Biến toàn cục lưu danh sách kỹ năng
let userSkills = []; 

// Hàm render kỹ năng ra UI
function renderSkills() {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = '';
    userSkills.forEach((skill, index) => {
        container.innerHTML += `
            <span class="badge badge-pulse p-2 m-1">
                ${skill} <i class="fas fa-times ml-1" style="cursor:pointer;" onclick="removeSkill(${index})"></i>
            </span>`;
    });
}

// Thêm kỹ năng
function addSkill() {
    const input = document.getElementById('newSkillInput');
    const val = input.value.trim();
    if (val && !userSkills.includes(val)) {
        userSkills.push(val);
        renderSkills();
        input.value = '';
    }
}

// Xóa kỹ năng
function removeSkill(index) {
    userSkills.splice(index, 1);
    renderSkills();
}
let cropper;

function openCropModal(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = document.getElementById('imageToCrop');
            image.src = e.target.result;
            
            $('#cropModal').modal('show');
            
            // Xóa cropper cũ nếu có và tạo cái mới chuẩn tỷ lệ 1:1 (Hình vuông/Tròn)
            if (cropper) cropper.destroy();
            setTimeout(() => {
                cropper = new Cropper(image, {
                    aspectRatio: 1,
                    viewMode: 1,
                });
            }, 200); // Đợi modal mở hẳn
        };
        reader.readAsDataURL(file);
    }
    event.target.value = ''; // Reset input
}

function uploadAvatar() {
    if (!cropper) return;
    
    // Lấy ảnh đã cắt dạng Base64
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const base64Image = canvas.toDataURL('image/png');

    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG TẢI LÊN...';

    // Bắn thẳng base64 lên server
    fetch('?page=upload_avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Cập nhật tất cả các ảnh đại diện trên giao diện
            document.querySelectorAll('.avatar-wrapper img, .profile-avatar img, .profile-menu-avatar img').forEach(img => {
                img.src = data.url;
            });
            $('#cropModal').modal('hide');
        } else {
            alert("Lỗi tải ảnh!");
        }
    })
    .finally(() => {
        btn.innerHTML = 'CẬP NHẬT ẢNH';
    });
}
// =========================================================================
// TASK 3: QUẢN LÝ VÒNG ĐỜI BÀI VIẾT (ÉP CHẠY GLOBAL ĐỂ KHỚP VỚI HTML ONCLICK)
// =========================================================================

// Kịch bản 1: Xóa mềm bài viết (Nháp, Cần sửa, Bị từ chối)
window.deleteArticle = function(articleId) {
    if (confirm("⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này không? Hành động này không thể hoàn tác.")) {
        window.processArticleAction(articleId, 'delete', "Đã xóa bài viết thành công!");
    }
};

// Kịch bản 2: Rút bài (Đang chờ duyệt -> Nháp)
window.withdrawArticle = function(articleId) {
    if (confirm("↩️ Bài viết đang chờ duyệt. Bạn có muốn rút lại thành Bản nháp để chỉnh sửa thêm không?")) {
        window.processArticleAction(articleId, 'withdraw', "Đã rút bài về bản nháp!");
    }
};

// Kịch bản 3: Mở Modal Yêu cầu gỡ bài (Đã đăng)
window.openTakedownModal = function(articleId) {
    const modalInput = document.getElementById('takedownArticleId');
    const modalReason = document.getElementById('takedownReason');
    const modalError = document.getElementById('takedownError');

    if (modalInput) modalInput.value = articleId;
    if (modalReason) modalReason.value = ''; // Xóa text cũ tránh lưu vết
    if (modalError) modalError.classList.add('d-none'); // Ẩn cảnh báo đỏ
    
    // Kích hoạt hiển thị Modal của Bootstrap 4
    $('#takedownModal').modal('show');
};

// Kịch bản 3.1: Gửi form Yêu cầu gỡ bài
window.submitTakedown = function() {
    const articleId = document.getElementById('takedownArticleId').value;
    const reason = document.getElementById('takedownReason').value.trim();

    if (reason === '') {
        const errorMsg = document.getElementById('takedownError');
        if (errorMsg) errorMsg.classList.remove('d-none');
        return;
    }

    $('#takedownModal').modal('hide');
    window.processArticleAction(articleId, 'request_takedown', "Đã gửi yêu cầu gỡ bài đến Ban Biên Tập!", reason);
};

// HÀM LÕI: Gửi AJAX request xuống Controller bằng Fetch API
window.processArticleAction = function(articleId, actionType, successMsg, extraData = '') {
    const formData = new FormData();
    formData.append('article_id', articleId);
    formData.append('action_type', actionType);
    if (extraData !== '') {
        formData.append('reason', extraData);
    }

    fetch('index.php?page=postnews_action', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert("✅ " + successMsg);
            window.location.reload(); // Tải lại trang để thấy sự thay đổi
        } else {
            alert("❌ Lỗi từ hệ thống: " + (data.message || "Thao tác thất bại."));
        }
    })
    .catch(error => {
        console.error('Error during fetch:', error);
        alert("❌ Đã xảy ra lỗi kết nối hoặc xử lý phía máy chủ.");
    });
};