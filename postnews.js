/**
 * NewsPulse Professional CMS - Core Logic
 * Naming Convention: camelCase for Methods & Variables 
 */

let currentStep = 1;
const totalSteps = 4;

// 1. ĐIỀU KHIỂN LUỒNG ĐƯỜNG ỐNG (PIPELINE NAVIGATION) [cite: 148, 153]
function handleMoveStep(stepIncrement) {
    // Chỉ kiểm tra lỗi khi nhấn "Tiếp theo" (stepIncrement = 1) [cite: 190]
    if (stepIncrement === 1 && !validateCurrentStep()) {
        console.warn("Validation failed for step " + currentStep);
        return; 
    }

    const nextStep = currentStep + stepIncrement;
    
    if (nextStep >= 1 && nextStep <= totalSteps) {
        // Cập nhật trạng thái hiển thị của các khối nội dung [cite: 104]
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        document.getElementById(`p-step-${currentStep}`).classList.remove('active');
        
        currentStep = nextStep;
        
        document.getElementById(`step-${currentStep}`).classList.add('active');
        document.getElementById(`p-step-${currentStep}`).classList.add('active');
        
        updateNavigationUI();
        
        // Nếu chuyển sang bước SEO, thực hiện đồng bộ dữ liệu ngay [cite: 164]
        if (currentStep === 3) {
            syncSeoPreview(); 
        }
    }
}

// 2. CẬP NHẬT GIAO DIỆN NÚT BẤM [cite: 105]
function updateNavigationUI() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    // Ẩn nút "Quay lại" nếu ở bước đầu tiên [cite: 101]
    btnPrev.style.display = currentStep === 1 ? 'none' : 'inline-block';
    
    // Đổi nhãn nút ở bước cuối cùng [cite: 181]
    if (currentStep === totalSteps) {
        btnNext.innerHTML = 'XÁC NHẬN XUẤT BẢN <i class="fas fa-paper-plane ml-2"></i>';
        btnNext.classList.replace('btn-pulse-action', 'btn-success');
    } else {
        btnNext.innerHTML = 'TIẾP THEO <i class="fas fa-arrow-right ml-2"></i>';
        btnNext.classList.replace('btn-success', 'btn-pulse-action');
    }
}

// 3. HỆ THỐNG KIỂM TRA LỖI (VALIDATION) [cite: 139, 153]
window.validateCurrentStep = function() {
    let isValid = true;
    const currentContainer = document.getElementById(`step-${currentStep}`);
    if (!currentContainer) return false;

    const inputs = currentContainer.querySelectorAll('input[required], select[required], textarea[required]');

    inputs.forEach(input => {
        const errorMsg = input.parentElement.querySelector('.error-msg');
        let value = input.value.trim();

        // Kiểm tra đặc biệt: Nếu là input ẩn lưu nội dung, phải lấy dữ liệu từ richEditor
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

// 4. BỘ CÔNG CỤ SOẠN THẢO (RICH TEXT EDITOR) [cite: 138, 153, 163]
function formatText(command) {
    // Sử dụng execCommand để thực hiện in đậm, nghiêng, gạch chân... [cite: 138]
    document.execCommand(command, false, null);
    document.getElementById('richEditor').focus();
}

// Đảm bảo placeholder cho contenteditable hoạt động tự nhiên
document.getElementById('richEditor').addEventListener('input', function() {
    const hiddenContentInput = document.getElementById('postContent');
    hiddenContentInput.value = this.innerHTML; // Đồng bộ nội dung vào input ẩn để submit [cite: 138]
});
/**
 * NewsPulse Professional CMS - Advanced Logic
 * Naming Convention: camelCase [cite: 154, 197]
 */

// 5. CHÈN ẢNH VÀO NỘI DUNG TẠI VỊ TRÍ CON TRỎ (REALISTIC CMS) [cite: 163]
function triggerContentImage() {
    document.getElementById('contentImageInput').click();
}

function processContentImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgHtml = `<img src="${e.target.result}" alt="Content Image" class="img-fluid my-3 shadow-sm">`;
            
            // Chèn ảnh vào vị trí con trỏ đang đứng trong trình soạn thảo
            document.getElementById('richEditor').focus();
            document.execCommand('insertHTML', false, imgHtml);
        };
        reader.readAsDataURL(file);
    }
}

// 6. XỬ LÝ ẢNH ĐẠI DIỆN (THUMBNAIL) [cite: 110, 119]
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

// 7. SEO REAL-TIME PREVIEW & AUTO SLUG [cite: 164, 183]
function syncSeoPreview() {
    const headline = document.getElementById('postTitle').value;
    const seoTitleInput = document.getElementById('seoTitle');
    const metaDescInput = document.getElementById('metaDesc');

    // Tự động điền SEO Title nếu để trống
    if (!seoTitleInput.value) seoTitleInput.value = headline;

    // Cập nhật độ dài ký tự
    document.getElementById('seoTitleCount').innerText = `${seoTitleInput.value.length}/60`;
    document.getElementById('metaDescCount').innerText = `${metaDescInput.value.length}/160`;

    // Cập nhật Google Preview
    document.getElementById('previewSeoTitle').innerText = seoTitleInput.value || "Tiêu đề bài viết...";
    document.getElementById('previewMetaDesc').innerText = metaDescInput.value || "Mô tả Meta bài viết...";

    // Xử lý tạo Slug thực tế (Khử dấu, gạch ngang) [cite: 30]
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

// 8. LOGIC HẸN GIỜ XUẤT BẢN [cite: 167, 185]
function togglePublishTime(show) {
    const picker = document.getElementById('schedulePicker');
    if (show) {
        picker.classList.remove('d-none');
    } else {
        picker.classList.add('d-none');
    }
}

// 9. XỬ LÝ CÁC HÀNH ĐỘNG NHANH (LƯU NHÁP / XUẤT BẢN) [cite: 167]
function handleQuickAction(actionType) {
    if (actionType === 'draft') {
        alert("✔️ Hệ thống NewsPulse: Đã lưu bản nháp thành công vào bộ nhớ tạm!");
        // Sử dụng commit: Creating new method - handleQuickAction [cite: 4, 12, 129]
    }
}

function submitFinalForm() {
    // Thu thập nội dung từ Rich Editor
    document.getElementById('postContent').value = document.getElementById('richEditor').innerHTML;
    
    alert("🚀 NewsPulse: Bài viết đã được gửi cho Ban Biên Tập để thẩm định xuất bản!");
    // window.location.href = "profile.html"; [cite: 35, 49]
}