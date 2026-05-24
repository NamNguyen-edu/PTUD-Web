document.addEventListener('DOMContentLoaded', function () {
    // Kéo cấu hình đường dẫn API 
    const API_URL = "/PTUD-Web/Repo/Controller/Catalogmanagement.php";

    // === 1. KHỞI TẠO BIẾN DOM ===
    const pageTitle = document.querySelector('.page-title');
    const tabButtons = document.querySelectorAll('button[data-bs-toggle="tab"]');
    const searchBar = document.getElementById('globalSearch');

    const addItemModalEl = document.getElementById('addItemModal');
    const addItemModal = addItemModalEl ? new bootstrap.Modal(addItemModalEl) : null;
    const inputName = document.getElementById('modal-name');
    const inputSlug = document.getElementById('modal-slug');
    const selectType = document.getElementById('modal-type');
    const btnSave = document.getElementById('btn-save-item');

    // Thêm các biến xử lý modal Chỉnh sửa xịn bằng UI
    const editItemModalEl = document.getElementById('editItemModal');
    const editItemModal = editItemModalEl ? new bootstrap.Modal(editItemModalEl) : null;
    const inputEditName = document.getElementById('edit-modal-name');
    const inputEditSlug = document.getElementById('edit-modal-slug');
    const btnUpdate = document.getElementById('btn-update-item');

    let rowToDelete = null;
    let rowToEdit = null;
    const deleteModalEl = document.getElementById('deleteModal');
    const deleteModal = deleteModalEl ? new bootstrap.Modal(deleteModalEl) : null;

    // === 2. HÀM TẠO SLUG TIẾNG VIỆT ===
    const createSlug = (text) => {
        if (!text) return "";
        return text.toString().toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd').replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    };

    // === 3. XỬ LÝ SLUG TỰ ĐỘNG TRÊN MODAL ===
    const updateSlugPreview = () => {
        const val = inputName.value;
        const type = selectType.value;
        const prefix = (type === 'Tag') ? '/tag/' : '/';
        inputSlug.value = val.trim() !== '' ? prefix + createSlug(val) : '';
    };

    inputName?.addEventListener('input', updateSlugPreview);
    selectType?.addEventListener('change', updateSlugPreview);

    inputEditName?.addEventListener('input', function () {
        const isTag = inputEditSlug.value.includes('/tag/');
        inputEditSlug.value = (isTag ? '/tag/' : '/') + createSlug(inputEditName.value);
    });

    // === 4. ĐỔI TIÊU ĐỀ KHI CHUYỂN TAB ===
    tabButtons.forEach(btn => {
        btn.addEventListener('shown.bs.tab', (e) => {
            if (pageTitle) {
                pageTitle.innerText = e.target.id === 'tag-tab-btn' ? 'Quản lý Thẻ (Tags)' : 'Quản lý chuyên mục';
            }
        });
    });

    // === 5. HÀM CHÈN MỘT HÀNG VÀO BẢNG UI ===
    const appendRowToTable = (type, id, name, slug, count = 0, isPrepend = false) => {
        const tbodyId = (type === 'Category') ? 'category-list-container' : 'tag-list-container';
        const targetTableBody = document.getElementById(tbodyId);

        if (!targetTableBody) return;

        const newRow = document.createElement('tr');
        // Lưu data attribute để biết ID thực tế trong database phục vụ Sửa/Xóa
        newRow.setAttribute('data-id', id);
        newRow.setAttribute('data-type', type);

        const iconHtml = type === 'Category'
            ? `<div class="cat-icon bg-tech me-3"><i class="fas fa-folder-open"></i></div>`
            : `<span class="text-muted fw-bold me-2">#</span>`;

        newRow.innerHTML = `
            <td class="ps-4">
                <div class="d-flex align-items-center">
                    ${iconHtml}
                    <div class="fw-bold item-name">${name}</div>
                </div>
            </td>
            <td class="text-center item-slug">${slug}</td>
            <td class="text-center">${count}</td>
            <td class="text-end pe-4">
                <button class="btn-action btn-edit me-1" title="Sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-action btn-delete text-danger" title="Xóa"><i class="fas fa-trash"></i></button>
            </td>
        `;

        if (isPrepend) {
            targetTableBody.prepend(newRow);
        } else {
            targetTableBody.appendChild(newRow);
        }
    };

    // === 6. ĐỌC DỮ LIỆU TỪ BACKEND PHP (FETCH DATA) ===
    const loadCatalogData = () => {
        document.getElementById('category-list-container').innerHTML = '';
        document.getElementById('tag-list-container').innerHTML = '';

        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Lỗi Network hệ thống: Status ${response.status}`);
                }
                // Đọc phản hồi dưới dạng chữ (text) trước để bẫy lỗi
                return response.text().then(text => {
                    try {
                        return JSON.parse(text); // Nếu là JSON chuẩn thì parse bình thường
                    } catch (err) {
                        // Nếu là chữ "Lỗi kết nối..." thì ném thẳng text đó vào catch bên dưới
                        throw new Error(`PHP trả về text lỗi, không phải JSON! Nguyên văn: \n"${text}"`);
                    }
                });
            })
            .then(data => {
                if (data.status === "success") {
                    data.categories.forEach(cat => appendRowToTable('Category', cat.category_id, cat.name, cat.slug, cat.count));
                    data.tags.forEach(tag => appendRowToTable('Tag', tag.tag_id, tag.name, tag.slug, tag.count));
                } else {
                    console.error("Lỗi lấy dữ liệu:", data.message);
                }
            })
            .catch(err => {
                // In trực tiếp nguyên nhân chí mạng ra Console để đọc cho dễ
                console.error("=== CHI TIẾT LỖI TỪ SERVER ===");
                console.error(err.message);
            });
    };

    // Chạy tải dữ liệu ngay khi mở trang
    loadCatalogData();

    // === 7. XỬ LÝ LƯU DỮ LIỆU MỚI (POST) ===
    btnSave?.addEventListener('click', () => {
        console.log("Đã kích hoạt sự kiện bấm nút Lưu!");

        const name = inputName.value.trim();
        const slug = inputSlug.value.trim();
        const type = selectType.value;

        if (!name) {
            alert('Vui lòng nhập tên hiển thị!');
            return;
        }

        const tbodyId = (type === 'Category') ? 'category-list-container' : 'tag-list-container';
        const targetTableBody = document.getElementById(tbodyId);

        if (!targetTableBody) {
            console.error("Không tìm thấy bảng hiển thị có ID là: " + tbodyId);
            return;
        }

        // Gửi dữ liệu sang file PHP backend
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name, slug })
        })
            .then(res => res.json())
            .then(data => {
                console.log("Kết quả PHP trả về:", data); // Kiểm tra xem PHP có báo success không

                if (data.status === "success") {
                    // Tạo hàng mới đẩy lên đầu danh sách tương ứng
                    const newRow = document.createElement('tr');

                    // Bổ sung các attribute để tí nữa bấm Sửa/Xóa trực tiếp không bị lỗi
                    newRow.setAttribute('data-id', data.id);
                    newRow.setAttribute('data-type', type);

                    const iconHtml = type === 'Category'
                        ? `<div class="cat-icon bg-tech me-3"><i class="fas fa-folder-open"></i></div>`
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
                        <button class="btn-action btn-edit me-1" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete text-danger" title="Xóa"><i class="fas fa-trash"></i></button>
                    </td>
                `;

                    targetTableBody.prepend(newRow);

                    // Reset form và đóng modal
                    inputName.value = '';
                    inputSlug.value = '';
                    if (addItemModal) addItemModal.hide();
                } else {
                    alert("Lỗi lưu từ DB đám mây: " + data.message);
                }
            })
            .catch(err => {
                console.error("Lỗi nghẽn đường truyền Fetch:", err);
                alert("Không thể gửi dữ liệu tới file PHP. Hãy kiểm tra lại đường dẫn API_URL!");
            });
    });

    // === 8. SỬA & XÓA BIẾN ĐỘNG (EVENT DELEGATION) ===
    document.addEventListener('click', function (e) {
        // --- Nhấn nút hiện Modal Xóa ---
        const delBtn = e.target.closest('.btn-delete');
        if (delBtn) {
            rowToDelete = delBtn.closest('tr');
            if (deleteModal) deleteModal.show();
            return;
        }

        // --- Nhấn nút hiện Modal Sửa xịn ---
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            rowToEdit = editBtn.closest('tr');
            const currentName = rowToEdit.querySelector('.item-name').innerText;
            const currentSlug = rowToEdit.querySelector('.item-slug').innerText;

            inputEditName.value = currentName;
            inputEditSlug.value = currentSlug;

            if (editItemModal) editItemModal.show();
        }
    });

    // === 9. THỰC THI SỬA GỬI LÊN PHP (PUT) ===
    btnUpdate?.addEventListener('click', function () {
        if (!rowToEdit || inputEditName.value.trim() === "") {
            alert("Tên phân loại không được để trống!");
            return;
        }

        const id = rowToEdit.getAttribute('data-id');
        const type = rowToEdit.getAttribute('data-type');
        const name = inputEditName.value.trim();
        const slug = inputEditSlug.value.trim();

        fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type, name, slug })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    rowToEdit.querySelector('.item-name').innerText = name;
                    rowToEdit.querySelector('.item-slug').innerText = slug;
                    if (editItemModal) editItemModal.hide();
                } else {
                    alert("Lỗi cập nhật: " + data.message);
                }
            });
    });

    // === 10. THỰC THI XÓA GỬI LÊN PHP (DELETE) ===
    window.executeDelete = function () {
        if (!rowToDelete) return;

        const id = rowToDelete.getAttribute('data-id');
        const type = rowToDelete.getAttribute('data-type');

        fetch(API_URL, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, type })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    rowToDelete.style.transition = "0.3s";
                    rowToDelete.style.opacity = "0";
                    setTimeout(() => {
                        rowToDelete.remove();
                        rowToDelete = null;
                    }, 300);
                } else {
                    alert("Lỗi xóa phân loại: " + data.message);
                }
                if (deleteModal) deleteModal.hide();
            });
    };

    // === 11. BỘ LỌC TÌM KIẾM NHANH ===
    searchBar?.addEventListener('input', function () {
        const term = this.value.toLowerCase().trim();
        const activePane = document.querySelector('.tab-pane.show.active');
        if (!activePane) return;

        const rows = activePane.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const name = row.querySelector('.item-name')?.innerText.toLowerCase() || "";
            row.style.display = name.includes(term) ? '' : 'none';
        });
    });
});