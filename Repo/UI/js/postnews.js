/**
 * NewsPulse Professional CMS - Core Logic
 * Naming Convention: camelCase for Methods & Variables
 */

// MODULE TỰ ĐỘNG LOAD COMPONENT (HEADER/FOOTER) TỪ TEAM
document.addEventListener("DOMContentLoaded", function() {
    
    // Tải Header
    // Tải Header
const hiddenCat = document.getElementById('hiddenCategory');
if (hiddenCat && hiddenCat.value) {
    const categorySelect = document.getElementById('postCategory');
    if (categorySelect) categorySelect.value = hiddenCat.value;
}
fetch("../components/header.html")
    .then(response => {
        if (!response.ok) throw new Error("Không thể load header");
        return response.text();
    })
    .then(data => {
        // Đắp HTML của header vào trang
        document.getElementById("header-placeholder").innerHTML = data;

        // 1. Ẩn nút Đăng nhập / Đăng ký
        document.getElementById("login-section").classList.add("d-none");
        
        // 2. Bật khu vực Profile lên (bỏ class d-none)
        document.getElementById("profile-section").classList.remove("d-none");
        document.getElementById("profile-section").classList.add("d-flex"); 
        
        // 3. Đổi tên và email
        document.getElementById("profile-name").innerText = "Nguyễn Duy Bảo";
        document.getElementById("profile-menu-name").innerText = "Nguyễn Duy Bảo";
        document.getElementById("profile-email").innerText = "Biên tập viên";
        document.getElementById("profile-menu-email").innerText = "baond@newspulse.vn";

        // --- ĐOẠN JS MỚI: XỬ LÝ CLICK XỔ MENU ---
        const profileBtn = document.querySelector('.profile-info');
        const profileMenu = document.querySelector('.profile-menu');

        // Khi click vào nút profile -> Bật/tắt menu
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Ngăn sự kiện click truyền ra ngoài
            profileMenu.classList.toggle('d-block'); // Ép hiển thị bằng class của Bootstrap
        });

        // Khi click ra vùng trống ngoài màn hình -> Tự động đóng menu
        document.addEventListener('click', function(e) {
            if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                profileMenu.classList.remove('d-block');
            }
        });
        // ----------------------------------------
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

let currentStep = 1;
const totalSteps = 4;

// 1. ĐIỀU KHIỂN LUỒNG ĐƯỜNG ỐNG (PIPELINE NAVIGATION)
function handleMoveStep(stepIncrement) {
    if (stepIncrement === 1 && !validateCurrentStep()) {
        console.warn("Validation failed for step " + currentStep);
        return; 
    }

    const nextStep = currentStep + stepIncrement;
    
    if (nextStep >= 1 && nextStep <= totalSteps) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`p-step-${currentStep}`).classList.remove('active');
        
        currentStep = nextStep;
        
        document.getElementById(`step-${currentStep}`).classList.add('active');
        document.getElementById(`p-step-${currentStep}`).classList.add('active');
        
        updateNavigationUI();
        
        if (currentStep === 3) {
            syncSeoPreview(); 
        }
    }
}

// 2. CẬP NHẬT GIAO DIỆN NÚT BẤM
function updateNavigationUI() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    btnPrev.style.display = currentStep === 1 ? 'none' : 'inline-block';
    
    if (currentStep === totalSteps) {
        btnNext.innerHTML = 'XÁC NHẬN XUẤT BẢN <i class="fas fa-paper-plane ml-2"></i>';
        btnNext.classList.replace('btn-pulse-action', 'btn-success');
    } else {
        btnNext.innerHTML = 'TIẾP THEO <i class="fas fa-arrow-right ml-2"></i>';
        btnNext.classList.replace('btn-success', 'btn-pulse-action');
    }
}

// 3. HỆ THỐNG KIỂM TRA LỖI (VALIDATION)
window.validateCurrentStep = function() {
    let isValid = true;
    const currentContainer = document.getElementById(`step-${currentStep}`);
    if (!currentContainer) return false;

    const inputs = currentContainer.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        const errorMsg = input.parentElement.querySelector('.error-msg');
        let value = input.value.trim();

        if (input.id === 'postContent') {
            value = document.getElementById('richEditor').innerText.trim();
        }
        
        if (!value) {
            input.classList.add('is-invalid');
            if (errorMsg) errorMsg.classList.remove('d-none');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            if (errorMsg) errorMsg.classList.add('d-none');
        }
    });

    return isValid;
};

// 4. BỘ CÔNG CỤ SOẠN THẢO (RICH TEXT EDITOR)
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('richEditor').focus();
}

document.getElementById('richEditor').addEventListener('input', function() {
    const hiddenContentInput = document.getElementById('postContent');
    hiddenContentInput.value = this.innerHTML; 
});

/**
 * NewsPulse Professional CMS - Advanced Logic
 */

// 5. CHÈN ẢNH VÀO NỘI DUNG TẠI VỊ TRÍ CON TRỎ
function triggerContentImage() {
    document.getElementById('contentImageInput').click();
}

function processContentImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgHtml = `<img src="${e.target.result}" alt="Content Image" class="img-fluid my-3 shadow-sm">`;
            
            document.getElementById('richEditor').focus();
            document.execCommand('insertHTML', false, imgHtml);
        };
        reader.readAsDataURL(file);
    }
}

// 6. XỬ LÝ ẢNH ĐẠI DIỆN (THUMBNAIL)
function previewThumbnail(event) {
    const file = event.target.files[0];
    const previewZone = document.getElementById('thumbPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewZone.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

// 7. SEO REAL-TIME PREVIEW & AUTO SLUG
function syncSeoPreview() {
    const headline = document.getElementById('postTitle').value;
    const seoTitleInput = document.getElementById('seoTitle');
    const metaDescInput = document.getElementById('metaDesc');

    if (!seoTitleInput.value) seoTitleInput.value = headline;

    document.getElementById('seoTitleCount').innerText = `${seoTitleInput.value.length}/60`;
    document.getElementById('metaDescCount').innerText = `${metaDescInput.value.length}/160`;

    document.getElementById('previewSeoTitle').innerText = seoTitleInput.value || "Tiêu đề bài viết...";
    document.getElementById('previewMetaDesc').innerText = metaDescInput.value || "Mô tả Meta bài viết...";

    const slug = headline.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '')
        .replace(/(\s+)/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    document.getElementById('postSlug').value = slug;
    document.getElementById('previewSlug').innerText = slug || "slug-bai-viet";
}

// 8. LOGIC HẸN GIỜ XUẤT BẢN
function togglePublishTime(show) {
    const picker = document.getElementById('schedulePicker');
    if (show) {
        picker.classList.remove('d-none');
    } else {
        picker.classList.add('d-none');
    }
}
function handleQuickAction(action, event) {

    if (event) {
        event.preventDefault();
    }

    try {

        // ==================================================
        // GET DATA
        // ==================================================

const title = document.getElementById('postTitle')?.value || '';
const editor = document.getElementById('richEditor');
const content = editor ? editor.innerHTML : '';
const slug = document.getElementById('postSlug')?.value || ''; // Trong HTML bạn đặt là postSlug
const excerpt = document.getElementById('metaDesc')?.value || ''; // Sửa ID này lại cho đúng với HTML
const category = document.getElementById('postCategory')?.value || ''; // Thêm lấy chuyên mục
const tags = document.getElementById('postTags')?.value || '';

        // ==================================================
        // ARTICLE ID
        // ==================================================

        const articleIdInput =
            document.getElementById('articleId');

        const articleId =
            articleIdInput
                ? articleIdInput.value
                : '';

        // ==================================================
        // VALIDATE
        // ==================================================

        if (
            !title.trim() ||
            !content.trim() ||
            content === '<br>'
        ) {

            alert(
                'Vui lòng nhập tiêu đề và nội dung!'
            );

            return;
        }

        // ==================================================
        // FORM DATA
        // ==================================================

  const formData = new FormData();
formData.append('title', title);
formData.append('content', content);
formData.append('slug', slug);
formData.append('excerpt', excerpt);
formData.append('category', category); // Gửi lên server
formData.append('tags', tags);         // Gửi lên server
formData.append('status', action === 'draft' ? 'draft' : 'published');

        // update mode
        if (articleId) {

            formData.append(
                'article_id',
                articleId
            );
        }

        console.log('FETCH START');


        fetch('?page=save_post', {

            method: 'POST',

            body: formData
        })

        .then(res => {

            console.log(res);

            return res.json();
        })

        .then(data => {

            console.log(data);

            if (data.success) {

                if (action === 'draft') {

                    alert(
                        '✔️ Đã lưu bản nháp!'
                    );

                    if (articleIdInput) {

                        articleIdInput.value =
                            data.article_id;
                    }

                    window.history.pushState(
                        {},
                        '',
                        '?page=postnews&id=' +
                        data.article_id
                    );

                } else {

                    alert(
                        '🎉 Xuất bản thành công!'
                    );

                    window.location.href =
                        '?page=profile';
                }

            } else {

                alert(
                    data.message ||
                    'Lỗi save bài viết'
                );
            }
        })

        .catch(err => {

            console.error(err);

            alert(
                'Lỗi kết nối server'
            );
        });

    } catch (error) {

        console.error(error);

        alert(
            'JS ERROR: ' + error.message
        );
    }
}