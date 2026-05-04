document.addEventListener("DOMContentLoaded", function () {
  // --- LOAD SIDEBAR ---
  const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
  if (sidebarPlaceholder) {
    fetch('/Repo/UI/html/sidebar_nav.html')
      .then(response => {
        if (!response.ok) throw new Error("Không thấy file sidebar");
        return response.text();
      })
      .then(data => {
        sidebarPlaceholder.innerHTML = data;

        // Tìm tên file hiện tại (vd: admin1.html)
        const currentPath = window.location.pathname.split("/").pop();

        // Tìm tất cả link trong sidebar (nhớ dùng class đúng của ní)
        const navLinks = document.querySelectorAll('.nav-link-custom, .nav-link');

        navLinks.forEach(link => {
          if (link.getAttribute('href') && link.getAttribute('href').includes(currentPath)) {
            link.classList.add('active');
          }
        });
      })
      .catch(err => console.error("Lỗi Sidebar:", err));
  }

  // --- LOAD HEADER ---
  const headerAdmin = document.getElementById('header_admin');
  if (headerAdmin) {
    fetch('/Repo/UI/html/header_admin.html')
      .then(response => {
        if (!response.ok) throw new Error("Không tìm thấy file header_admin.html");
        return response.text();
      })
      .then(data => {
        headerAdmin.innerHTML = data;
        // Thêm class top-header sau khi đổ dữ liệu để ăn CSS định vị
        headerAdmin.className = "top-header";
      })
      .catch(err => console.error("Lỗi Header:", err));
  }
});