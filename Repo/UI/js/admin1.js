

function addComment() {
    const textarea = document.querySelector('textarea[placeholder="Thêm bình luận..."]');
    const text = textarea.value.trim();

    if (!text) {
        showToast('Vui lòng nhập nội dung bình luận', 'warn');
        return;
    }

    const commentSection = document.querySelector('.white-card:last-child');

    const newComment = document.createElement('div');
    newComment.className = 'comment-item';

    newComment.innerHTML = `
        <img src="https://i.pravatar.cc/150?u=chief" class="comment-avatar">
        <div class="comment-bubble active">
            <div class="d-flex justify-content-between small mb-1">
                <span class="fw-bold text-primary">
                    Julian Vane
                    <span class="fw-normal text-muted">(Tổng biên tập)</span>
                </span>
                <span class="text-muted" style="font-size: 10px;">
                    ${new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
            <p class="small mb-0">${text}</p>
        </div>
    `;

    const inputArea = commentSection.querySelector('.mt-4.pt-3.border-top');

    commentSection.insertBefore(newComment, inputArea);

    textarea.value = '';

    newComment.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    showToast('Đã thêm ghi chú biên tập');
}



function approveArticle() {

    // Step hiện tại
    const activeStep = document.querySelector('.step-active');

    // Step kế tiếp
    const nextStep = activeStep.nextElementSibling;

    // Chuyển step hiện tại -> complete
    activeStep.classList.remove('step-active');
    activeStep.classList.add('step-complete');

    activeStep.innerHTML = `
        <div class="step-box">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">
                check_circle
            </span>
        </div>
        <p class="small fw-bold mt-2 mb-0">Tổng biên tập phê duyệt</p>
    `;

    // Active bước kế tiếp
    if (nextStep) {
        nextStep.classList.remove('opacity-50');

        nextStep.innerHTML = `
            <div class="step-box text-white bg-primary">
                <span class="material-symbols-outlined">
                    radio_button_checked
                </span>
            </div>
            <p class="small fw-bold mt-2 mb-0 text-primary">
                Đã duyệt
            </p>
        `;
    }

    // Disable nút
    const btn = document.querySelector('.btn-approve');
    btn.disabled = true;
    btn.style.opacity = '0.7';

    showToast('Bài viết đã được duyệt và chuyển sang xuất bản');

    setTimeout(() => {
        showModal(
            'Đã duyệt bài viết!',
            'Bài viết đã được chuyển sang trạng thái xuất bản.',
            'check_circle',
            'success'
        );
    }, 700);
}



function requestRevision() {

    const form = document.getElementById('revisionForm');

    if (form.style.display === 'none' || form.style.display === '') {

        form.style.display = 'block';

        form.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

    } else {

        form.style.display = 'none';
    }
}

function submitRevision() {

    const text = document
        .getElementById('revisionText')
        .value
        .trim();

    if (!text) {

        showToast(
            'Vui lòng nhập nội dung chỉnh sửa',
            'warn'
        );

        return;
    }

    // Step hiện tại
    const activeStep = document.querySelector('.step-active');

    activeStep.classList.remove('step-active');
    activeStep.classList.add('step-rejected');

    activeStep.innerHTML = `
        <div class="step-box bg-warning text-dark">
            <span class="material-symbols-outlined">
                edit_note
            </span>
        </div>

        <p class="small fw-bold mt-2 mb-0 text-warning-emphasis">
            Yêu cầu chỉnh sửa
        </p>
    `;

    // disable nút
    document.querySelector('.btn-approve').disabled = true;
    document.querySelector('.btn-revision').disabled = true;

    document.querySelector('.btn-approve').style.opacity = '0.5';
    document.querySelector('.btn-revision').style.opacity = '0.5';

    showToast(
        'Đã gửi yêu cầu chỉnh sửa',
        'warn'
    );

    setTimeout(() => {

        showModal(
            'Đã gửi yêu cầu chỉnh sửa',
            'Biên tập viên sẽ cập nhật nội dung trước khi gửi lại.',
            'edit_note',
            'warn'
        );

    }, 500);
}

function rejectArticle() {

    const confirmReject = confirm(
        'Bạn có chắc muốn từ chối bài viết này?'
    );

    if (!confirmReject) return;

    // Step hiện tại
    const activeStep = document.querySelector('.step-active');

    // Đổi sang trạng thái rejected
    activeStep.classList.remove('step-active');
    activeStep.classList.add('step-rejected');

    activeStep.innerHTML = `
        <div class="step-box bg-danger text-white">
            <span class="material-symbols-outlined"
                  style="font-variation-settings:'FILL' 1">
                cancel
            </span>
        </div>

        <p class="small fw-bold mt-2 mb-0 text-danger">
            Bài viết bị từ chối
        </p>
    `;

    // Disable các nút action
    document.querySelector('.btn-approve').disabled = true;
    document.querySelector('.btn-revision').disabled = true;

    document.querySelector('.btn-approve').style.opacity = '0.5';
    document.querySelector('.btn-revision').style.opacity = '0.5';

    showToast(
        'Bài viết đã bị từ chối',
        'reject'
    );

    setTimeout(() => {

        showModal(
            'Đã từ chối bài viết',
            'Thông báo từ chối đã được gửi về cho biên tập viên.',
            'cancel',
            'reject'
        );

    }, 500);
}


function showToast(message, type = 'success') {

    let toast = document.getElementById('custom-toast');

    if (!toast) {

        toast = document.createElement('div');
        toast.id = 'custom-toast';

        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.zIndex = '9999';
        toast.style.padding = '14px 20px';
        toast.style.borderRadius = '16px';
        toast.style.color = '#fff';
        toast.style.fontWeight = '700';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
        toast.style.transition = 'all .35s ease';
        toast.style.transform = 'translateY(80px)';
        toast.style.opacity = '0';

        document.body.appendChild(toast);
    }

    toast.innerHTML = message;

    if (type === 'warn') {
        toast.style.background = '#f59e0b';
    } else if (type === 'reject') {
        toast.style.background = '#dc2626';
    } else {
        toast.style.background = '#2563eb';
    }

    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.transform = 'translateY(80px)';
        toast.style.opacity = '0';
    }, 3200);
}


function showModal(title, desc, icon, type) {

    let overlay = document.getElementById('workflow-modal');

    if (!overlay) {

        overlay = document.createElement('div');

        overlay.id = 'workflow-modal';

        overlay.innerHTML = `
            <div class="workflow-modal-box">
                <div class="modal-icon-wrap">
                    <span class="material-symbols-outlined modal-main-icon">
                        ${icon}
                    </span>
                </div>

                <h3 class="fw-black mb-3">${title}</h3>

                <p class="text-muted mb-4">
                    ${desc}
                </p>

                <button class="btn btn-primary rounded-pill px-4 fw-bold">
                    Đóng
                </button>
            </div>
        `;

        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(15,23,42,.55)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '99999';

        document.body.appendChild(overlay);

        const box = overlay.querySelector('.workflow-modal-box');

        box.style.background = '#fff';
        box.style.padding = '40px';
        box.style.borderRadius = '24px';
        box.style.width = '90%';
        box.style.maxWidth = '430px';
        box.style.textAlign = 'center';
        box.style.animation = 'popup .3s ease';

        const iconWrap = overlay.querySelector('.modal-icon-wrap');

        iconWrap.style.width = '72px';
        iconWrap.style.height = '72px';
        iconWrap.style.borderRadius = '50%';
        iconWrap.style.display = 'flex';
        iconWrap.style.alignItems = 'center';
        iconWrap.style.justifyContent = 'center';
        iconWrap.style.margin = '0 auto 20px';

        if (type === 'warn') {
            iconWrap.style.background = '#fff7ed';
        } else {
            iconWrap.style.background = '#eff6ff';
        }

        const iconEl = overlay.querySelector('.modal-main-icon');

        iconEl.style.fontSize = '38px';

        overlay.querySelector('button').onclick = () => {
            overlay.remove();
        };
    }
}


document.querySelector('.btn-approve')
    .addEventListener('click', approveArticle);

document.querySelector('.btn-revision')
    .addEventListener('click', requestRevision);

document.querySelector('.text-danger.fw-bold.small.cursor-pointer')
    .addEventListener('click', rejectArticle);

document.querySelector('.btn-link')
    .addEventListener('click', addComment);

document.querySelector('textarea[placeholder="Thêm bình luận..."]')
    .addEventListener('keydown', function(e) {

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    });

