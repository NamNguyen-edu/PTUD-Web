// MODULE TỰ ĐỘNG LOAD COMPONENT (HEADER/FOOTER)

// 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
document.addEventListener("DOMContentLoaded", function() {
    const BASE = "/PTUD-Web/Repo/UI";



    // Skills
    const hiddenSkillsInput = document.getElementById('hiddenSkills');
    if (hiddenSkillsInput && hiddenSkillsInput.value && hiddenSkillsInput.value !== '{{SKILLS_JSON}}') {
        try {
            userSkills = JSON.parse(hiddenSkillsInput.value);
            renderSkills();
        } catch(e) {
            console.error("Lỗi parse JSON kỹ năng:", e);
        }
            checkArticleAlerts();
        }
    }); // Đóng DOMContentLoaded ở dòng 4

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

        const listContainer = document.getElementById('alertArticlesList');
        if (!listContainer) return;

        let listHtml = '<ul class="list-group mb-0 border-0">';

        // Lặp qua bài viết lỗi và CHỈ TẠO HTML CƠ BẢN (Đã bỏ dòng lý do)
        articles.forEach(art => {
            let st = statusMap[art.status] || { label: art.status, cls: 'secondary', icon: 'fa-info' };

            listHtml += `
                <li class="list-group-item border-left-${st.cls} shadow-sm mb-3 rounded" style="border-width: 0 0 0 4px !important; cursor: pointer;" onclick="window.location.href=\`${art.status === 'revision' ? '?page=postnews&id=' + art.article_id : '?page=user-version-control&article_id=' + art.article_id}\`">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <h6 class="mb-0 font-weight-bold text-truncate" style="max-width: 65%;">${art.title}</h6>
                        <span class="badge badge-${st.cls} p-1"><i class="fas ${st.icon} mr-1"></i>${st.label}</span>
                    </div>
                    <div class="text-right mt-2">
                        <small class="text-primary font-weight-bold">Xem nhận xét & So sánh thay đổi <i class="fas fa-arrow-right ml-1"></i></small>
                    </div>
                </li>
            `;
        });

        listHtml += '</ul>';
        
        // Bơm dữ liệu vào thẻ div chờ sẵn trong HTML
        listContainer.innerHTML = listHtml;

        // Gọi Bootstrap kích hoạt Popup
        setTimeout(() => {
            $('#articleAlertModal').modal('show');
        }, 500);
    } // Đóng checkArticleAlerts

    // 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
    function initProfile() {
        loadReadingHistory();
        $('[data-toggle="tooltip"]').tooltip();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProfile);
    } else {
        initProfile();
    }

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


// 5. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP LẦN ĐẦU (ĐÃ XÓA THEO YÊU CẦU)

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
                                ${parseInt(item.read_count) === 1 ? 'Đọc lần đầu tiên' : `Đã đọc ${item.read_count} lần`}
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
    });}
let loadedBookmarks = [];

function renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmarkContainer');
    if (!container) return;

    container.innerHTML = bookmarks.map(b => {
        // Render category name if available
        const categoryBadge = b.category_name 
            ? `<span class="badge badge-primary mb-2 px-2.5 py-1" style="font-size: 0.72rem; font-weight: 700; background-color: #eff6ff; color: #0d6efd; border-radius: 6px;">${b.category_name}</span>` 
            : '';
        return `
            <div class="col-md-6 mb-4" id="bookmark-card-${b.article_id}">
                <div class="card h-100 border-0 shadow-sm article-card-mini" style="border-radius: 12px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;">
                    <div style="position: relative; height: 160px; overflow: hidden;">
                        <img src="${b.thumbnail_url || 'https://picsum.photos/400/200'}" class="w-100 h-100 object-fit-cover" alt="${b.title}">
                    </div>
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            ${categoryBadge}
                            <h6 class="font-weight-bold line-clamp-2" style="font-size: 0.88rem; line-height: 1.4; color: #1e293b; margin-top: 4px;">${b.title}</h6>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                            <small class="text-muted" style="font-size: 0.75rem;">
                                <i class="far fa-clock mr-1"></i>${timeAgoProfile(b.bookmarked_at)}
                            </small>
                            <button class="btn btn-link btn-sm text-danger p-0" title="Bỏ lưu" onclick="removeBookmark(${b.article_id})" style="position: relative; z-index: 2;">
                                <i class="fas fa-bookmark"></i>
                            </button>
                        </div>
                        <a href="?page=article&slug=${b.slug}" class="stretched-link"></a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.loadBookmarks = async function() {
    try {
        const res = await fetch('?page=get_bookmarks');
        const result = await res.json();

        const container = document.getElementById('bookmarkContainer');
        const empty = document.getElementById('bookmarkEmpty');
        const count = document.getElementById('bookmarkCount');
        const statCount = document.getElementById('statBookmarks');

        if (!result.success || !result.data.length) {
            count.textContent = '0';
            statCount.textContent = '0';
            return;
        }

        loadedBookmarks = result.data;
        count.textContent = loadedBookmarks.length;
        statCount.textContent = loadedBookmarks.length;
        empty.classList.add('d-none');

        renderBookmarks(loadedBookmarks);

    } catch (e) {
        console.error('Lỗi load bookmark:', e);
    }
}

window.removeBookmark = async function(articleId) {
    try {
        const res = await fetch('?page=bookmark_toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ article_id: articleId })
        });
        const result = await res.json();
        if (result.success && !result.is_bookmarked) {
            document.getElementById(`bookmark-card-${articleId}`)?.remove();
            loadedBookmarks = loadedBookmarks.filter(b => b.article_id !== articleId);
            
            const count = document.getElementById('bookmarkCount');
            const statCount = document.getElementById('statBookmarks');
            const newCount = parseInt(count.textContent) - 1;
            count.textContent = newCount;
            statCount.textContent = newCount;
            if (newCount === 0) {
                document.getElementById('bookmarkEmpty')?.classList.remove('d-none');
            }
        }
    } catch (e) {
        console.error('Lỗi bỏ bookmark:', e);
    }
}

window.initBookmarkSorting = function() {
    const sortBtn = document.querySelector('#bookmarks .dropdown-toggle');
    const menuItems = document.querySelectorAll('#bookmarks .dropdown-menu .dropdown-item');

    if (!sortBtn || !menuItems.length) return;

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sortType = this.getAttribute('data-sort');
            const label = this.textContent.trim();

            sortBtn.innerHTML = `${label} <i class="fas fa-chevron-down ml-1" style="font-size: 0.7rem;"></i>`;

            if (sortType === 'newest') {
                loadedBookmarks.sort((a, b) => new Date(b.bookmarked_at) - new Date(a.bookmarked_at));
            } else if (sortType === 'oldest') {
                loadedBookmarks.sort((a, b) => new Date(a.bookmarked_at) - new Date(b.bookmarked_at));
            } else if (sortType === 'category') {
                loadedBookmarks.sort((a, b) => {
                    const catA = a.category_name || '';
                    const catB = b.category_name || '';
                    return catA.localeCompare(catB, 'vi');
                });
            }

            renderBookmarks(loadedBookmarks);
        });
    });
}

window.handleLogout = function() {
    window.location.href = "?page=logout";
}

window.timeAgoProfile = function(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    return Math.floor(diff / 86400) + ' ngày trước';
}

document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    initBookmarkSorting();
});
