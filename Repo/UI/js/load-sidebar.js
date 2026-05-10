document.addEventListener("DOMContentLoaded", function () {
  // Hàm bổ trợ để fetch HTML
  const loadComponent = (id, url, callback) => {
    const el = document.getElementById(id);
    if (!el) return Promise.resolve(); // Nếu không có placeholder thì bỏ qua

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
    loadComponent('sidebar-placeholder', '/Repo/UI/html/sidebar_nav.html', (el) => {
      // Xử lý Active Link
      const currentPath = window.location.pathname.split("/").pop() || "admin_dashboard.html";
      const navLinks = el.querySelectorAll('.nav-link-custom, .nav-link');

      navLinks.forEach(link => {
        link.classList.remove('active'); // Dọn dẹp trước khi add
        const href = link.getAttribute('href');
        if (href && (href.includes(currentPath) || (currentPath === "" && href.includes("index")))) {
          link.classList.add('active');
        }
      });
    }),
    loadComponent('header_admin', '/Repo/UI/html/header_admin.html', (el) => {
      el.className = "top-header";
    })
  ]).then(() => {
    // --- QUAN TRỌNG NHẤT Ở ĐÂY ---
    // Sau khi nạp xong tất cả HTML, chúng ta mới phát sự kiện cho Dashboard
    console.log("Hệ thống UI đã nạp xong, bắt đầu đổ dữ liệu Dashboard...");
    document.dispatchEvent(new Event('appReady'));
  });
});