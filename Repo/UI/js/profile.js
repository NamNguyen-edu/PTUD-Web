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
const realName = document.querySelector('.profile-sidebar h4')?.innerText || 'Biên tập viên';
document.getElementById("profile-name").innerText = realName;
document.getElementById("profile-menu-name").innerText = realName;

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
        const hiddenSkillsInput = document.getElementById('hiddenSkills');
    if (hiddenSkillsInput && hiddenSkillsInput.value) {
        // Rào điều kiện để tránh lỗi nếu biến chưa được PHP thay thế
        if (hiddenSkillsInput.value !== '{{SKILLS_JSON}}') {
            try {
                userSkills = JSON.parse(hiddenSkillsInput.value);
                renderSkills(); // Gọi hàm vẽ tag ra màn hình
            } catch(e) {
                console.error("Lỗi parse JSON kỹ năng:", e);
            }
        }
    }
});


// 2. KHỞI TẠO KHI TRANG LOAD XONG (Phần logic cũ của Profile)
document.addEventListener('DOMContentLoaded', function() {
    console.log("⚡ NewsPulse Profile System Ready!");
    
    // Kiểm tra xem có phải lần đầu đăng nhập không để hiện Popup Preference
    checkFirstTimeLogin();
    
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
    console.log("Switched to tab: " + targetTab);
    
    if (targetTab === "#history") {
        renderHistoryList();
    }
});


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