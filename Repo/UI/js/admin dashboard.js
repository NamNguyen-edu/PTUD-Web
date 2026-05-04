// Thay vì dùng DOMContentLoaded, hãy đợi sự kiện appReady từ load-sidebar.js
document.addEventListener('appReady', () => {
    console.log('Dashboard nhận tín hiệu appReady: Bắt đầu chạy hiệu ứng...');

    // 1. Counter Animation
    const animateCounters = () => {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const decimal = +counter.getAttribute('data-decimal') || 0;
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 2000;
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = (easeProgress * target).toFixed(decimal);

                const formattedVal = parseFloat(currentVal).toLocaleString(undefined, {
                    minimumFractionDigits: decimal,
                    maximumFractionDigits: decimal
                });

                counter.innerText = formattedVal + suffix;
                if (progress < 1) requestAnimationFrame(updateCounter);
            };
            requestAnimationFrame(updateCounter);
        });
    };

    // 2. Sidebar Toggle (Lưu ý: nút này nằm TRONG sidebar nên phải đợi nạp xong mới gán được event)
    const initSidebarLogic = () => {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const body = document.body;

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth > 991.98) {
                    body.classList.toggle('sidebar-collapsed');
                } else if (sidebar) {
                    sidebar.classList.toggle('show');
                }
            });
        }

        // Đóng sidebar khi click ngoài (Mobile)
        document.addEventListener('click', (e) => {
            if (sidebar && window.innerWidth <= 991.98 && sidebar.classList.contains('show') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    };

    // 3. Dynamic Chart Animation
    const initChart = () => {
        const paths = document.querySelectorAll('.chart-path');
        paths.forEach(path => {
            const dashAttr = path.getAttribute('stroke-dasharray');
            if (dashAttr) {
                const dashArray = dashAttr.split(',')[0];
                const offset = 100 - parseInt(dashArray);
                setTimeout(() => {
                    path.style.strokeDashoffset = offset;
                }, 100);
            }
        });
    };

    // 4. Interaction Feedback
    const initFeedback = () => {
        // Selector này sẽ bao gồm cả các nút mới được load từ Sidebar/Header
        const interactives = document.querySelectorAll('.btn, .nav-link, .nav-link-custom, .fab, .card, .table-hover tbody tr');
        interactives.forEach(el => {
            el.addEventListener('click', function () {
                console.log('Interaction:', this.innerText?.trim() || 'Element clicked');
            });
        });
    };

    // Khởi chạy tất cả
    animateCounters();
    initSidebarLogic();
    initChart();
    initFeedback();
});