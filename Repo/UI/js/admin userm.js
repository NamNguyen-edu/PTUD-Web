    document.addEventListener('DOMContentLoaded', function() {
            const selectAll = document.getElementById('selectAll');
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            const toastEl = document.getElementById('actionToast');
            const toast = new bootstrap.Toast(toastEl);
            const toastBody = toastEl.querySelector('.toast-body');

            function showToast(message, type = 'success') {
                toastEl.className = `toast align-items-center border-0 bg-${type}`;
                toastBody.textContent = message;
                toast.show();
            }

            // Select All functionality
            selectAll.addEventListener('change', () => {
                rowCheckboxes.forEach(cb => cb.checked = selectAll.checked);
            });

            // Bulk Actions Logic
            document.querySelector('.sticky-footer').addEventListener('click', (e) => {
                const actionBtn = e.target.closest('button');
                if (!actionBtn) return;
                
                const selectedRows = Array.from(rowCheckboxes).filter(cb => cb.checked).map(cb => cb.closest('tr'));
                
                if (selectedRows.length === 0) {
                    showToast('Please select at least one user', 'warning');
                    return;
                }

                const actionText = actionBtn.textContent.trim().toLowerCase();
                
                if (actionText.includes('suspend')) {
                    selectedRows.forEach(row => {
                        const statusCell = row.querySelector('td:nth-child(4)');
                        statusCell.innerHTML = '<small class="fw-bold text-muted opacity-50"><span class="status-indicator bg-secondary"></span>Inactive</small>';
                    });
                    showToast(`Suspended ${selectedRows.length} users`, 'warning');
                } else if (actionText.includes('delete')) {
                    selectedRows.forEach(row => row.remove());
                    showToast(`Deleted ${selectedRows.length} users`, 'danger');
                    // Update count (visual only for demo)
                    const countEl = document.querySelector('.card-footer span');
                    countEl.textContent = `Showing ${document.querySelectorAll('tbody tr').length} users`;
                } else if (actionText.includes('invite')) {
                    showToast(`Invites sent to ${selectedRows.length} users`, 'success');
                }
            });

            // Individual Actions Logic
            document.querySelector('tbody').addEventListener('click', (e) => {
                const target = e.target;
                const row = target.closest('tr');

                if (target.classList.contains('action-suspend')) {
                    e.preventDefault();
                    const statusCell = row.querySelector('td:nth-child(4)');
                    statusCell.innerHTML = '<small class="fw-bold text-muted opacity-50"><span class="status-indicator bg-secondary"></span>Inactive</small>';
                    showToast('User suspended successfully', 'warning');
                }
                
                if (target.classList.contains('action-delete')) {
                    e.preventDefault();
                    row.remove();
                    showToast('User deleted successfully', 'danger');
                }
            });

            // Original search logic preserved
            const searchInput = document.querySelector('.search-input');
            searchInput.addEventListener('keyup', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(term) ? '' : 'none';
                });
            });
        });