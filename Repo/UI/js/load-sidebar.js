document.addEventListener("DOMContentLoaded", function () {
  // Hàm bổ trợ để fetch HTML
  const loadComponent = (id, url, callback) => {
    const el = document.getElementById(id);
    if (!el) return Promise.resolve(); 

    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Lỗi nạp ${url}`);
        return response.text();
      })
      .then(data => {
        el.innerHTML = data;
        if (callback) callback(el);
      })
      .catch(err => console.error(err));
  };

  // Chạy nạp cả hai cùng lúc
  Promise.all([
    loadComponent('sidebar-placeholder', '../html/sidebar_nav.html', (el) => {
      // Xử lý Active Link
      const currentPath = window.location.pathname.split("/").pop() || "../html/admin_dashboard.html";
      const navLinks = el.querySelectorAll('.nav-link-custom, .nav-link');

      navLinks.forEach(link => {
        link.classList.remove('active'); // Dọn dẹp trước khi add
        const href = link.getAttribute('href');
        if (href && (href.includes(currentPath) || (currentPath === "" && href.includes("index")))) {
          link.classList.add('active');
        }
      });
    }),
    loadComponent('header_admin', '../html/header_admin.html', (el) => {
      el.className = "top-header";
    })
  ]).then(() => {
    console.log("Hệ thống UI đã nạp xong, bắt đầu đổ dữ liệu Dashboard...");
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('#sidebarToggle');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        document.body.classList.toggle('sidebar-open');
      });

      document.addEventListener('click', (event) => {
        if (sidebar.classList.contains('show') && !sidebar.contains(event.target) && !toggleBtn.contains(event.target) && window.innerWidth <= 992) {
          sidebar.classList.remove('show');
          document.body.classList.remove('sidebar-open');
        }
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
          sidebar.classList.remove('show');
          document.body.classList.remove('sidebar-open');
        }
      });
    }

    document.dispatchEvent(new Event('appReady'));
  });
});