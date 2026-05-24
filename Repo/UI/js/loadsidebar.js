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
    // SỬA LẦN 1: Đường dẫn Sidebar
    loadComponent('sidebar-placeholder', 'UI/html/sidebar_nav.html', (el) => {
      // NÂNG CẤP: Xử lý Active Link cho chuẩn Router
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = urlParams.get('page') || 'admin_dashboard';
      const navLinks = el.querySelectorAll('.nav-link-custom, .nav-link');

      navLinks.forEach(link => {
        link.classList.remove('active'); // Dọn dẹp trước khi add
        const href = link.getAttribute('href');
        // Quét xem cái link trong menu có trùng với cái ?page= hiện tại không
        if (href && href.includes(currentPage)) {
          link.classList.add('active');
        }
      });
    }),
    // SỬA LẦN 2: Đường dẫn Header
    loadComponent('header_admin', 'UI/html/header_admin.html', (el) => {
      el.className = "top-header";
    })
  ]).then(() => {
    console.log("Hệ thống UI đã nạp xong, bắt đầu đổ dữ liệu Dashboard...");
    document.dispatchEvent(new Event('appReady'));
  });
});