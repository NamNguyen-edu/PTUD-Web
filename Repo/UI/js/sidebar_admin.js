// UI/js/sidebar_admin.js

function initSidebar() {
  const sidebarLinks = document.querySelectorAll('.sidebar .nav-link-custom');
  
  // Lấy query parameter 'page' hiện tại
  const currentUrlParams = new URLSearchParams(window.location.search);
  let currentPage = currentUrlParams.get('page') ? currentUrlParams.get('page').toLowerCase() : '';
  
  // Nếu không có tham số page, mặc định hiển thị active cho Bảng điều khiển
  if (!currentPage || currentPage === 'index.php') {
    currentPage = 'admin_dashboard';
  }

  console.log("initSidebar: Đang tải trạng thái active cho trang:", currentPage);

  if (sidebarLinks.length > 0) {
    sidebarLinks.forEach(link => {
      const linkHref = link.getAttribute('href') ? link.getAttribute('href').toLowerCase() : '';
      
      link.classList.remove('active');

      // So khớp thông minh:
      // 1. Khớp chính xác tham số page (ví dụ: page=accountmanagement)
      // 2. Hoặc nếu currentPage là admin_dashboard và link href trỏ đến admin_dashboard
      if (
        (currentPage && linkHref && linkHref.includes(`page=${currentPage}`)) ||
        (currentPage === 'admin_dashboard' && linkHref.includes('page=admin_dashboard'))
      ) {
        link.classList.add('active');
        console.log("Đã kích hoạt active cho link:", linkHref);
      }

      // Đăng ký sự kiện click (cho trải nghiệm SPA mượt mà hoặc phản hồi tức thì)
      link.addEventListener('click', function () {
        sidebarLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  const toggleBtn = document.querySelector('#sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('show');
      document.body.classList.toggle('sidebar-open');
    });
  }

  // Phân quyền Frontend: Ẩn Account Management nếu là editor
  fetch('?page=get_current_user')
    .then(res => res.json())
    .then(data => {
      if (data.logged && data.user.role === 'editor') {
        const accLink = document.querySelector('a[href="index.php?page=accountmanagement"]');
        if (accLink) accLink.style.display = 'none';
      }
    })
    .catch(err => console.error(err));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}