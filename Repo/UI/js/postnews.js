/**
 * NewsPulse Professional CMS - Core Logic
 * Naming Convention: camelCase for Methods & Variables
 */

// MODULE TỰ ĐỘNG LOAD COMPONENT (HEADER/FOOTER) TỪ TEAM
document.addEventListener("DOMContentLoaded", function() {

    const existingThumbUrl = document.getElementById('currentThumbUrl');
    const previewZone = document.getElementById('thumbPreview');
    
    // Nếu biến có chứa đường dẫn thật (không phải trống và không chứa chữ {{THUMBNAIL_URL}} nguyên bản)
    if (existingThumbUrl && existingThumbUrl.value.trim() !== '' && !existingThumbUrl.value.includes('{{')) {
        let finalUrl = existingThumbUrl.value;
        
        // Nếu ảnh không phải link mạng mà là file upload, nhớ chèn đường dẫn gốc (Nếu cần)
        // finalUrl = '../' + finalUrl; (Mở comment dòng này nếu ảnh bị lỗi hiển thị do sai đường dẫn tương đối)

        previewZone.innerHTML = `<img src="${finalUrl}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;">`;
    }
    
    const hiddenCat = document.getElementById('hiddenCategory');
    if (hiddenCat && hiddenCat.value) {
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect) categorySelect.value = hiddenCat.value;
    }
});

let currentStep = 1;
const totalSteps = 4;

// 1. ĐIỀU KHIỂN LUỒNG ĐƯỜNG ỐNG (PIPELINE NAVIGATION)
function handleMoveStep(stepIncrement) {
    if (stepIncrement === 1 && !validateCurrentStep()) {
        console.warn("Validation failed for step " + currentStep);
        return; 
    }

    // Nếu đang ở bước cuối cùng mà bấm nút Xác nhận xuất bản
    if (currentStep === totalSteps && stepIncrement === 1) {
        handleQuickAction('publish', window.event);
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


// 9. CORE ACTION: GỬI DỮ LIỆU LÊN SERVER (ĐÃ GỘP TẤT CẢ)
function handleQuickAction(action, event) {
    if (event) {
        event.preventDefault();
    }

    try {
        // ==================================================
        // 1. LẤY DỮ LIỆU TEXT
        // ==================================================
        const title = document.getElementById('postTitle')?.value || '';
        const editor = document.getElementById('richEditor');
        const content = editor ? editor.innerHTML : '';
        const slug = document.getElementById('postSlug')?.value || '';
        const excerpt = document.getElementById('metaDesc')?.value || '';
        const category = document.getElementById('postCategory')?.value || '';
        const tags = document.getElementById('postTags')?.value || '';
        
        const articleIdInput = document.getElementById('articleId');
        const articleId = articleIdInput ? articleIdInput.value : '';

        // ==================================================
        // 2. LẤY FILE ẢNH THUMBNAIL
        // ==================================================
        const thumbInput = document.getElementById('thumbInput');
        const thumbnailFile = thumbInput && thumbInput.files.length > 0 ? thumbInput.files[0] : null;

        // ==================================================
        // 3. KIỂM TRA LỖI (VALIDATION)
        // ==================================================
        if (!title.trim() || !content.trim() || content === '<br>') {
            if (window.showGlobalModal) {
                window.showGlobalModal('Yêu cầu nhập liệu', 'Vui lòng điền đầy đủ Tiêu đề và Nội dung bài viết!');
            } else {
                alert('Vui lòng nhập tiêu đề và nội dung bài viết!');
            }
            return;
        }

        // Bắt buộc có ảnh nếu xuất bản (và là bài viết mới chưa có ID)
        if (action !== 'draft' && !thumbnailFile && !articleId) {
            if (window.showGlobalModal) {
                window.showGlobalModal('Yêu cầu ảnh đại diện', 'Vui lòng chọn ảnh đại diện (Thumbnail) cho bài viết trước khi xuất bản!');
            } else {
                alert('Vui lòng chọn ảnh đại diện (Thumbnail) trước khi xuất bản!');
            }
            return;
        }

        // ==================================================
        // 4. ĐÓNG GÓI DỮ LIỆU (FORM DATA)
        // ==================================================
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('slug', slug);
        formData.append('excerpt', excerpt);
        formData.append('category', category);
        formData.append('tags', tags);
        
        formData.append('status', action === 'draft' ? 'draft' : 'pending');

        // Gắn file ảnh vào form nếu user có chọn ảnh mới
        if (thumbnailFile) {
            formData.append('thumbnail', thumbnailFile);
        }

        // Nếu đang sửa bài thì truyền ID
        if (articleId) {
            formData.append('article_id', articleId);
        }

        // Đổi trạng thái nút bấm (loading)
        const btn = event.target;
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ĐANG XỬ LÝ...';
            btn.disabled = true;
        }

        // ==================================================
        // 5. GỬI REQUEST LÊN SERVER
        // ==================================================
        console.log('Bắt đầu tải lên dữ liệu bài viết...');

        fetch('?page=save_post', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            // Phục hồi nút bấm
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }

            if (data.success) {
                if (action === 'draft') {
                    if (window.showGlobalModal) {
                        window.showGlobalModal('Lưu bản nháp', 'Đã lưu bản nháp bài viết thành công!');
                    } else {
                        alert('✔️ Đã lưu bản nháp thành công!');
                    }
                    if (articleIdInput) {
                        articleIdInput.value = data.article_id;
                    }
                    window.history.pushState({}, '', '?page=postnews&id=' + data.article_id);
                } else {
                    if (data.is_rejected) {
                        if (window.showGlobalModal) {
                            window.showGlobalModal('Tự động Từ chối!', 'Bài viết đã vượt quá giới hạn chỉnh sửa (1.3) và hệ thống đã tự động từ chối duyệt.', () => {
                                window.location.href = '?page=profile';
                            });
                        } else {
                            alert('Bài viết đã bị tự động từ chối do vượt quá giới hạn chỉnh sửa (1.3)!');
                            window.location.href = '?page=profile';
                        }
                    } else {
                        if (window.showGlobalModal) {
                            window.showGlobalModal('Gửi bài viết', 'Chúc mừng! Bài viết của bạn đã được gửi duyệt thành công.', () => {
                                window.location.href = '?page=profile';
                            });
                        } else {
                            alert('🎉 Đã gửi bài viết thành công!');
                            window.location.href = '?page=profile';
                        }
                    }
                }
            } else {
                if (window.showGlobalModal) {
                    window.showGlobalModal('Thông báo lỗi', data.message || 'Lỗi hệ thống khi lưu bài viết.');
                } else {
                    alert(data.message || 'Lỗi hệ thống khi lưu bài viết.');
                }
            }
        })
        .catch(err => {
            console.error(err);
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            if (window.showGlobalModal) {
                window.showGlobalModal('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!');
            } else {
                alert('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
            }
        });

    } catch (error) {
        console.error(error);
        if (window.showGlobalModal) {
            window.showGlobalModal('Lỗi xử lý', 'Đã xảy ra lỗi hệ thống: ' + error.message);
        } else {
            alert('JS ERROR: ' + error.message);
        }
    }
}