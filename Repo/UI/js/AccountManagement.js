
const API_URL = "index.php?page=api_account";

let currentUsersList = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 4;

// Khởi chạy khi tài liệu HTML đã sẵn sàng
document.addEventListener('DOMContentLoaded', function () {
    // 1. Tải dữ liệu ban đầu từ CSDL
    loadUsersFromBackend();

    // 2. Kích hoạt bộ lắng nghe sự kiện Tìm kiếm (Search Box)
    initSearch();

    // 3. Kích hoạt bộ lắng nghe sự kiện Checkbox tất cả
    initCheckboxEvents();
z
    // 4. Đăng ký sự kiện Thao tác hàng loạt (Bulk Actions ở sticky-footer)
    initBulkActions();
});

// =========================================================================
// ĐOẠN 1: TẢI VÀ ĐỒNG BỘ DỮ LIỆU TỪ BACKEND PHP
// =========================================================================

async function loadUsersFromBackend() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Không thể kết nối API");

        const result = await response.json();
        if (result.success) {
            currentUsersList = result.data;
            filteredData = [...currentUsersList]; // Sao chép để làm bộ lọc

            updateKPIs(); // Cập nhật lại số lượng ở 3 thẻ kpi top
            renderTable(); // Vẽ lại bảng dữ liệu
        }
    } catch (error) {
        console.error("Lỗi:", error);
        showToast("Không thể đồng bộ dữ liệu từ CSDL!", "danger");
    }
}

function updateKPIs() {
    const total = currentUsersList.length;
    const active = currentUsersList.filter(u => u.status === "Active").length;
    const pending = currentUsersList.filter(u => u.status === "Pending").length;

    document.getElementById("kpi-total-users").innerText = total.toLocaleString();
    document.getElementById("kpi-active-users").innerText = active;
    document.getElementById("kpi-pending-users").innerText = pending;
}

// =========================================================================
// ĐOẠN 2: DỰNG GIAO DIỆN BẢNG HTML VÀ PHÂN TRANG ĐỘNG
// =========================================================================
function formatTimeAgo(dateString) {
    if (!dateString || dateString === 'Never') return 'Never';
    const date = new Date(dateString.replace(/-/g, "/"));
    const now = new Date();
    const secondsPast = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsPast < 0 || secondsPast < 60) return 'Just now';
    if (secondsPast < 3600) {
        const minutes = Math.floor(secondsPast / 60);
        return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    if (secondsPast < 86400) {
        const hours = Math.floor(secondsPast / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    if (secondsPast < 2592000) {
        const days = Math.floor(secondsPast / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderTable() {
    const tbody = document.getElementById("account-list");
    tbody.innerHTML = "";

    // Thuật toán cắt mảng dữ liệu theo trang hiện tại
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = filteredData.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy thành viên nào.</td></tr>`;
        updatePaginationControls(0);
        return;
    }

    // Vẽ từng dòng <tr> dựa trên mảng cắt ra (Đã khớp hoàn toàn với 7 cột ở HTML)
    paginatedItems.forEach(user => {
        let statusBadge = "";
        if (user.status === "Active") {
            statusBadge = '<span class="badge bg-success bg-opacity-10 text-success">Active</span>';
        } else if (user.status === "Pending") {
            statusBadge = '<span class="badge bg-warning bg-opacity-10 text-warning">Pending</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary bg-opacity-10 text-secondary">Suspended</span>';
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="ps-4 align-middle">
                <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}" onchange="evaluateCheckedCount()"/>
            </td>
            
            <td class="align-middle">
                <div class="d-flex align-items-center gap-3">
                    <img src="${user.avatar || 'https://i.pravatar.cc/150'}" class="rounded-circle" width="36" height="36" alt="avatar" onerror="this.src='https://i.pravatar.cc/150'">
                    <div class="fw-bold text-dark mb-0">${user.name}</div>
                </div>
            </td>
            
            <td class="align-middle text-secondary small">${user.email}</td>
            
            <td class="align-middle fw-medium text-dark">${user.role}</td>
            
            <td class="align-middle">${statusBadge}</td>
            
            <td class="align-middle text-secondary small">${formatTimeAgo(user.lastActive)}</td>
            
            <td class="text-end pe-4 align-middle">
                <div class="dropdown">
                    <button class="btn btn-light btn-sm border-0 bg-transparent" data-bs-toggle="dropdown">
                        <span class="material-symbols-outlined fs-5">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item small fw-bold" href="#" onclick="updateSingleStatus(${user.id}, 'Suspended')">Suspend</a></li>
                        <li><a class="dropdown-item small text-danger fw-bold" href="#" onclick="deleteSingleUser(${user.id})">Delete</a></li>
                    </ul>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Reset lại checkbox tiêu đề và bộ đếm hàng loạt
    document.getElementById("selectAll").checked = false;
    evaluateCheckedCount();
    updatePaginationControls(paginatedItems.length);
}

function updatePaginationControls(currentRowsCount) {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, totalItems);
    document.getElementById("pagination-info").innerText = `Showing ${startItem}-${endItem} of ${totalItems} users`;

    const container = document.getElementById("pagination-container");
    container.innerHTML = "";

    container.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    container.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

function changePage(page) {
    currentPage = page;
    renderTable();
}

// =========================================================================
// ĐOẠN 3: XỬ LÝ BIỂU MẪU (FORM TẠO USER MỚI)
// =========================================================================

async function submitCreateUserForm() {
    const form = document.getElementById("createUserForm");

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const postData = {
        name: document.getElementById("reg-name").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        role: document.getElementById("reg-role").value,
        status: document.getElementById("reg-status").value
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        const result = await response.json();

        if (result.success) {
            await loadUsersFromBackend(); // Load lại từ DB

            // Đóng modal ẩn form
            const modalElement = document.getElementById('createUserModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            form.reset();
            form.classList.remove('was-validated');
            currentPage = 1;
            showToast(result.message, 'success');
        }
    } catch (error) {
        showToast("Lỗi hệ thống khi tạo người dùng!", "danger");
    }
}

// =========================================================================
// ĐOẠN 4: THAO TÁC ĐƠN LẺ TRÊN TỪNG DÒNG (CSDL REAL-TIME)
// =========================================================================

async function deleteSingleUser(userId) {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này vĩnh viễn khỏi CSDL?")) return;
    try {
        const response = await fetch(`${API_URL}?id=${userId}`, { method: "DELETE" });
        const result = await response.json();
        if (result.success) {
            await loadUsersFromBackend();
            showToast(result.message, 'danger');
        }
    } catch (error) {
        showToast("Lỗi khi thực hiện xóa!", "danger");
    }
}

async function updateSingleStatus(userId, newStatus) {
    try {
        // Tận dụng API Bulk Action chạy cho 1 người để tiết kiệm dung lượng code backend
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'suspend', ids: [userId] })
        });
        const result = await response.json();
        if (result.success) {
            await loadUsersFromBackend();
            showToast("Đã đình bản thành viên thành công!", 'warning');
        }
    } catch (error) {
        showToast("Gặp lỗi khi cập nhật trạng thái!", "danger");
    }
}

// =========================================================================
// ĐOẠN 5: CHỌN VÀ THAO TÁC HÀNG LOẠT (BULK ACTIONS FOOTER)
// =========================================================================

function initCheckboxEvents() {
    const selectAllCb = document.getElementById("selectAll");
    selectAllCb.addEventListener("change", (e) => {
        const checkboxes = document.querySelectorAll(".user-checkbox");
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        evaluateCheckedCount();
    });
}

function evaluateCheckedCount() {
    const checkedBoxes = document.querySelectorAll(".user-checkbox:checked");
    document.getElementById("selected-count").innerText = checkedBoxes.length;
}

function initBulkActions() {
    document.querySelector('.sticky-footer').addEventListener('click', async (e) => {
        const actionBtn = e.target.closest('button');
        if (!actionBtn) return; // Nhấn trượt nút bấm thì bỏ qua

        const checkedBoxes = document.querySelectorAll(".user-checkbox:checked");
        if (checkedBoxes.length === 0) {
            showToast('Vui lòng chọn ít nhất một thành viên từ bảng!', 'warning');
            return;
        }

        const actionText = actionBtn.textContent.trim().toLowerCase();
        let actionType = '';

        if (actionText.includes('suspend')) actionType = 'suspend';
        else if (actionText.includes('delete')) actionType = 'delete';
        else if (actionText.includes('invite')) actionType = 'invite';

        if (actionType === 'delete' && !confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN ${checkedBoxes.length} thành viên đã chọn?`)) return;

        const ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionType, ids: ids })
            });
            const result = await response.json();
            if (result.success) {
                await loadUsersFromBackend();

                let toastType = 'success';
                if (actionType === 'delete') toastType = 'danger';
                if (actionType === 'suspend') toastType = 'warning';

                showToast(result.message, toastType);
            }
        } catch (error) {
            console.error(error);
            showToast("Lỗi xử lý thao tác hàng loạt!", "danger");
        }
    });
}

// =========================================================================
// ĐOẠN 6: TÌM KIẾM NHANH KẾT HỢP GỬI QUERY XUỐNG PHP
// =========================================================================

function initSearch() {
    const searchInput = document.getElementById("userSearch");
    if (!searchInput) return;

    let typingTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(typingTimer);
        // Kỹ thuật Debounce: Chờ gõ ngừng hẳn 300ms rồi mới gửi request để tránh nghẽn băng thông CSDL Cloud
        typingTimer = setTimeout(async () => {
            const keyword = e.target.value.trim();
            try {
                const response = await fetch(`${API_URL}?search=${encodeURIComponent(keyword)}`);
                const result = await response.json();
                if (result.success) {
                    filteredData = result.data;
                    currentPage = 1; // Khởi động lại về trang 1
                    renderTable();
                }
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            }
        }, 300);
    });
}

// =========================================================================
// ĐOẠN 7: HIỂN THỊ HỘP TOAST THÔNG BÁO THEO BANNER MÀU BOOTSTRAP
// =========================================================================

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('actionToast');
    const toastBody = document.getElementById('toastMessage');

    // Reset lại màu nền lớp phủ trước khi gán màu mới
    toastEl.className = `toast align-items-center border-0 text-white bg-${type}`;
    toastBody.innerText = message;

    const bootstrapToast = bootstrap.Toast.getOrCreateInstance(toastEl);
    bootstrapToast.show();
}