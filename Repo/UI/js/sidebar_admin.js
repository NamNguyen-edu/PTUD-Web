// UI/js/sidebar_admin.js

function initSidebar() {
  const sidebarLinks = document.querySelectorAll('.sidebar .nav-link-custom');
  const currentUrlParams = new URLSearchParams(window.location.search);
  const currentPage = currentUrlParams.get('page') ? currentUrlParams.get('page').toLowerCase() : '';

  if (sidebarLinks.length > 0) {
    sidebarLinks.forEach(link => {
      const linkHref = link.getAttribute('href') ? link.getAttribute('href').toLowerCase() : '';

      link.classList.remove('active');

      if (currentPage && linkHref && linkHref.includes(`page=${currentPage}`)) {
        link.classList.add('active');
      }

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}