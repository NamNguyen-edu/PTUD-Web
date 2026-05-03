document.addEventListener('DOMContentLoaded', function () {
    // === 1. KHỞI TẠO BIẾN ===
    const pageTitle = document.querySelector('.page-title');
    const tabButtons = document.querySelectorAll('button[data-bs-toggle="tab"]');
    const searchBar = document.getElementById('globalSearch');
    
    const addItemModalEl = document.getElementById('addItemModal');
    const addItemModal = addItemModalEl ? new bootstrap.Modal(addItemModalEl) : null;
    const inputName = document.getElementById('modal-name');
    const inputSlug = document.getElementById('modal-slug');
    const selectType = document.getElementById('modal-type');
    const btnSave = document.getElementById('btn-save-item');

    // === 2. HÀM TẠO SLUG TIẾNG VIỆT ===
    const createSlug = (text) => {
        if (!text) return "";
        return text.toString().toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Xóa dấu
            .replace(/[đĐ]/g, 'd').replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
            .replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''); 
    };

    // === 3. XỬ LÝ SLUG TỰ ĐỘNG ===
    const updateSlugPreview = () => {
        const val = inputName.value;
        const type = selectType.value;
        const prefix = (type === 'Tag') ? '/tag/' : '/';
        inputSlug.value = val.trim() !== '' ? prefix + createSlug(val) : '';
    };

    inputName?.addEventListener('input', updateSlugPreview);
    selectType?.addEventListener('change', updateSlugPreview);

    // === 4. CHUYỂN TAB ĐỔI TIÊU ĐỀ ===
    tabButtons.forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            if (pageTitle) pageTitle.innerText = e.target.id === 'tag-tab-btn' ? 'Quản lý Thẻ (Tags)' : 'Quản lý chuyên mục';
        });
    });

    // === 5. TÌM KIẾM NHANH ===
    searchBar?.addEventListener('input', function() {
        const term = this.value.toLowerCase().trim();
        const activePane = document.querySelector('.tab-pane.show.active');
        const rows = activePane.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const name = row.querySelector('.name-text')?.innerText.toLowerCase() || "";
            row.style.display = name.includes(term) ? '' : 'none';
        });
    });
    // === 6. THÊM MỚI Dữ liệu ===

     btnSave.addEventListener('click', () => {
    // Lấy giá trị từ các biến đã khai báo ở trên
    const name = inputName.value.trim();
    const slug = inputSlug.value;
    const type = selectType.value; // Lấy 'Category' hoặc 'Tag'

    if (!name) {
        alert('Vui lòng nhập tên hiển thị!');
        return;
    }

    // 1. Chọn đúng bảng dựa trên ID bảng trong HTML của ní (tableCategory hoặc tableTag)
    const tbodyId = (type === 'Category') ? 'category-tbody' : 'tag-tbody';
    const targetTableBody = document.getElementById(tbodyId);

    if (!targetTableBody) {
        console.error("Không tìm thấy tbody của bảng!");
        return;
    }

    // 2. Tạo hàng mới
    const newRow = document.createElement('tr');
    const iconHtml = type === 'Category' 
        ? `<div class="cat-icon bg-info text-white p-2 rounded me-3"><i class="fas fa-microchip"></i></div>`
        : `<span class="text-muted fw-bold me-2">#</span>`;

    newRow.innerHTML = `
        <td class="ps-4">
            <div class="d-flex align-items-center">
                ${iconHtml}
                <div class="fw-bold item-name">${name}</div>
            </div>
        </td>
        <td class="text-center item-slug">${slug}</td>
        <td class="text-center">0</td>
        <td class="text-end pe-4">
            <button class="btn btn-light btn-sm btn-edit me-1"><i class="fas fa-edit"></i></button>
            <button class="btn btn-light btn-sm btn-delete text-danger"><i class="fas fa-trash"></i></button>
        </td>
    `;

    // 3. Thêm vào đầu bảng
    targetTableBody.prepend(newRow);

    // 4. Reset form và đóng modal
    inputName.value = '';
    inputSlug.value = '';
    
    // Gọi đúng ID của modal là 'addItemModal'
    const modalElement = document.getElementById('addItemModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
});

    // === 7. XÓA & SỬA (EVENT DELEGATION) ===
    document.addEventListener('click', function(e) {
        // Xóa
        const delBtn = e.target.closest('.btn-delete');
        if (delBtn) {
            const row = delBtn.closest('tr');
            if (confirm("Ní chắc muốn xóa không?")) row.remove();
            return;
        }

        // Sửa
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const row = editBtn.closest('tr');
            const nameEl = row.querySelector('.name-text');
            const slugEl = row.querySelector('.slug-text');
            const newName = prompt("Nhập tên mới:", nameEl.innerText);
            if (newName && newName.trim() !== "") {
                nameEl.innerText = newName.trim();
                const isTag = slugEl.innerText.includes('/tag/');
                slugEl.innerText = (isTag ? '/tag/' : '/') + createSlug(newName);
            }
        }
    });
});