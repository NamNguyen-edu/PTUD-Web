document.addEventListener("DOMContentLoaded", function () {
  // Tự động nhận dạng môi trường chạy (PHP hay file tĩnh HTML trực tiếp)
  const isPHP = window.location.search.includes('page=') || window.location.pathname.includes('index.php');
  const sidebarUrl = isPHP ? 'UI/html/sidebar_admin.html' : '../html/sidebar_admin.html';
  const headerUrl = isPHP ? 'UI/html/header_admin.html' : '../html/header_admin.html';
  const sidebarJsUrl = isPHP ? 'UI/js/sidebar_admin.js' : '../js/sidebar_admin.js';
  const headerUserJsUrl = isPHP ? 'UI/js/header_user.js' : '../js/header_user.js';
  const headerAdminJsUrl = isPHP ? 'UI/js/header_admin.js' : '../js/header_admin.js';

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
    loadComponent('sidebar-placeholder', sidebarUrl, (el) => {
      // Xử lý Active Link
      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentPage = currentUrlParams.get('page') ? currentUrlParams.get('page').toLowerCase() : '';
      const navLinks = el.querySelectorAll('.nav-link-custom, .nav-link');

      navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.includes(`page=${currentPage}`)) {
          link.classList.add('active');
        }
      });

      // Nạp file JS cho sidebar
      const script = document.createElement('script');
      script.src = sidebarJsUrl;
      document.body.appendChild(script);
    }),
    loadComponent('header_admin', headerUrl, (el) => {
      el.className = "top-header";
      // Nạp các file JS cho header admin
      const scriptUser = document.createElement('script');
      scriptUser.src = headerUserJsUrl;
      document.body.appendChild(scriptUser);

      const scriptAdmin = document.createElement('script');
      scriptAdmin.src = headerAdminJsUrl;
      document.body.appendChild(scriptAdmin);
    })
  ]).then(() => {
    console.log("Hệ thống UI đã nạp xong, bắt đầu phát sự kiện appReady...");
    // Kích hoạt sự kiện appReady cho Dashboard vẽ biểu đồ
    document.dispatchEvent(new Event('appReady'));
  });
});
