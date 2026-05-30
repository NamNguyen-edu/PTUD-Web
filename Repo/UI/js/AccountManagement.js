// Đã sửa lại đường dẫn chuẩn, bỏ chữ /UI/ đi
const API_URL = "index.php?action=account_api";

let currentUsersList = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 5; // Có thể tùy chỉnh số dòng trên 1 trang

document.addEventListener('DOMContentLoaded', function () {
    loadUsersFromBackend();
    initSearch();
    initCheckboxEvents();
});

// ==========================================
// 1. TẢI DỮ LIỆU VÀ CẬP NHẬT KPI
// ==========================================
async function loadUsersFromBackend() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Không thể kết nối API");

        const result = await response.json();
        if (result.success) {
            currentUsersList = result.data;
            filteredData = [...currentUsersList];

            updateKPIs();
            renderTable();
        }
    } catch (error) {
        console.error("Lỗi:", error);
        showToast("Không thể đồng bộ dữ liệu từ CSDL!", "danger");
    }
}

function updateKPIs() {
    const total = currentUsersList.length;
    // Database trả về 'Active', 'Pending' (hoặc active, pending tùy bạn cấu hình DB)
    const active = currentUsersList.filter(u => u.status.toLowerCase() === "active").length;
    const pending = currentUsersList.filter(u => u.status.toLowerCase() === "pending").length;

    document.getElementById("kpi-total-users").innerText = total.toLocaleString();
    document.getElementById("kpi-active-users").innerText = active.toLocaleString();
    document.getElementById("kpi-pending-users").innerText = pending.toLocaleString();
}

// ==========================================
// 2. HIỂN THỊ BẢNG VÀ PHÂN TRANG
// ==========================================
function renderTable() {
    const tbody = document.getElementById("account-list");
    tbody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = filteredData.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy dữ liệu.</td></tr>`;
        updatePaginationControls();
        return;
    }

    paginatedItems.forEach(user => {
        let statusBadge = "";
        const statusStr = user.status ? user.status.toLowerCase() : "";

        if (statusStr === "active") {
            statusBadge = '<span class="badge bg-success bg-opacity-10 text-success">Active</span>';
        } else if (statusStr === "pending") {
            statusBadge = '<span class="badge bg-warning bg-opacity-10 text-warning">Pending</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary bg-opacity-10 text-secondary">Suspended/Banned</span>';
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="ps-4 align-middle">
                <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}" onchange="evaluateCheckedCount()"/>
            </td>
            <td class="align-middle">
                <div class="d-flex align-items-center gap-3">
                    <img src="${user.avatar || 'https://i.pravatar.cc/150?u=' + user.id}" class="rounded-circle" width="36" height="36" alt="avatar">
                    <div class="fw-bold text-dark mb-0">${user.name}</div>
                </div>
            </td>
            <td class="align-middle text-secondary small">${user.email}</td>
            <td class="align-middle fw-medium text-dark text-capitalize">${user.role}</td>
            <td class="align-middle">${statusBadge}</td>
            <td class="align-middle text-secondary small">${formatTimeAgo(user.lastActive)}</td>
            <td class="text-end pe-4 align-middle">
                <div class="dropdown">
                    <button class="btn btn-light btn-sm border-0 bg-transparent" data-bs-toggle="dropdown">
                        <span class="material-symbols-outlined fs-5">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><a class="dropdown-item small fw-bold" href="#" onclick="updateSingleStatus(${user.id}, 'suspend')">Suspend</a></li>
                        <li><a class="dropdown-item small text-danger fw-bold" href="#" onclick="deleteSingleUser(${user.id})">Delete</a></li>
                    </ul>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("selectAll").checked = false;
    evaluateCheckedCount();
    updatePaginationControls();
}

function updatePaginationControls() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, totalItems);
    document.getElementById("pagination-info").innerText = `Showing ${startItem}-${endItem} of ${totalItems} users`;

    const container = document.getElementById("pagination-container");
    container.innerHTML = "";

    container.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Prev</a>
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

// ==========================================
// 3. THAO TÁC API (THÊM, XÓA, SỬA)
// ==========================================
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
            await loadUsersFromBackend();
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
            form.reset();
            form.classList.remove('was-validated');
            showToast(result.message, 'success');
        } else {
            showToast(result.message || "Lỗi khi tạo user!", "danger");
        }
    } catch (error) {
        showToast("Lỗi hệ thống khi tạo người dùng!", "danger");
    }
}

async function deleteSingleUser(userId) {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'delete', ids: [userId] })
        });
        const result = await response.json();
        if (result.success) {
            await loadUsersFromBackend();
            showToast("Đã xóa người dùng thành công", 'danger');
        }
    } catch (error) {
        showToast("Lỗi khi thực hiện xóa!", "danger");
    }
}

async function updateSingleStatus(userId, actionType) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: actionType, ids: [userId] })
        });
        const result = await response.json();
        if (result.success) {
            await loadUsersFromBackend();
            showToast("Đã cập nhật trạng thái thành công!", 'warning');
        }
    } catch (error) {
        showToast("Lỗi khi cập nhật trạng thái!", "danger");
    }
}

// ==========================================
// 4. TÌM KIẾM & CHECKBOX & BULK ACTIONS
// ==========================================
function initSearch() {
    let typingTimer;
    document.getElementById("userSearch").addEventListener('input', (e) => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(async () => {
            const keyword = e.target.value.trim();
            try {
                const response = await fetch(`${API_URL}?search=${encodeURIComponent(keyword)}`);
                const result = await response.json();
                if (result.success) {
                    filteredData = result.data;
                    currentPage = 1;
                    renderTable();
                }
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            }
        }, 300);
    });
}

function initCheckboxEvents() {
    document.getElementById("selectAll").addEventListener("change", (e) => {
        document.querySelectorAll(".user-checkbox").forEach(cb => cb.checked = e.target.checked);
        evaluateCheckedCount();
    });
}

function evaluateCheckedCount() {
    const count = document.querySelectorAll(".user-checkbox:checked").length;
    document.getElementById("selected-count").innerText = count;
}

async function handleBulkAction(actionType) {
    const checkedBoxes = document.querySelectorAll(".user-checkbox:checked");
    if (checkedBoxes.length === 0) {
        showToast('Vui lòng chọn ít nhất một thành viên!', 'warning');
        return;
    }

    if (actionType === 'delete' && !confirm(`Bạn có chắc muốn xóa ${checkedBoxes.length} thành viên?`)) return;

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
            showToast(result.message || "Thực hiện thành công", actionType === 'delete' ? 'danger' : 'success');
        }
    } catch (error) {
        showToast("Lỗi xử lý thao tác hàng loạt!", "danger");
    }
}

// ==========================================
// 5. TIỆN ÍCH (TOAST & THỜI GIAN)
// ==========================================
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('actionToast');
    toastEl.className = `toast align-items-center border-0 text-white bg-${type}`;
    document.getElementById('toastMessage').innerText = message;
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
}

function formatTimeAgo(dateString) {
    if (!dateString || dateString === 'Never' || dateString === '0000-00-00 00:00:00') return 'Never';
    const date = new Date(dateString.replace(/-/g, "/"));
    const secondsPast = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (secondsPast < 60) return 'Just now';
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)} mins ago`;
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)} hours ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}