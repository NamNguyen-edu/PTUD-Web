document.addEventListener('DOMContentLoaded', () => {
  // Để tương thích ngược nếu có trình duyệt gọi DOMContentLoaded
});

function initHeaderAdmin() {
  console.log("initHeaderAdmin được gọi!");
  const profileTrigger = document.querySelector('.profile-info-admin');
  const profileContainer = document.querySelector('.profile-container-admin');

  console.log("profileTrigger:", profileTrigger);
  console.log("profileContainer:", profileContainer);

  if (profileTrigger && profileContainer) {
    if (profileTrigger.dataset.listenerAdded === "true") {
      console.log("Sự kiện click đã được đăng ký trước đó. Bỏ qua đăng ký trùng lặp!");
      return;
    }
    profileTrigger.dataset.listenerAdded = "true";

    // Đăng ký sự kiện click mở rộng menu
    profileTrigger.addEventListener('click', (e) => {
      console.log("Đã click nút profileTrigger!");
      e.stopPropagation();
      profileContainer.classList.toggle('active');
      console.log("Lớp active sau khi click:", profileContainer.className);
    });

    // Bấm ra ngoài để đóng menu
    document.addEventListener('click', () => {
      console.log("Đã click ra ngoài document!");
      profileContainer.classList.remove('active');
    });
  }

  // Tự động đồng bộ tên và avatar
  const mainNameEl = document.getElementById('profile-name');
  const dropdownNameEl = document.getElementById('profile-menu-name');
  const mainAvatarImg = document.getElementById('user-avatar-img');
  const dropdownAvatarImg = document.getElementById('user-avatar-dropdown-img');

  if (mainNameEl && dropdownNameEl) {
    // TỰ ĐỘNG NẠP DỮ LIỆU ĐỘC LẬP: Tránh kẹt chữ "Đang tải..." trên trang Admin
    if (mainNameEl.textContent === "Đang tải...") {
      fetch('index.php?page=get_current_user')
        .then(r => r.json())
        .then(data => {
          if (data && data.logged && data.user) {
            const name = data.user.name || 'Người dùng';
            mainNameEl.textContent = name;
            dropdownNameEl.textContent = name;

            const avatarUrl = data.user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=002D5E&color=fff';
            if (mainAvatarImg) mainAvatarImg.src = avatarUrl;
            if (dropdownAvatarImg) dropdownAvatarImg.src = avatarUrl;
          }
        })
        .catch(err => console.warn("Lỗi tự động nạp thông tin trong header_admin.js:", err));
    }

    // Đồng bộ ngay lập tức nếu dữ liệu đã được nạp từ trước bởi nguồn khác (tránh bất đồng bộ)
    if (mainNameEl.textContent !== "Đang tải...") {
      dropdownNameEl.textContent = mainNameEl.textContent;
      if (mainAvatarImg && dropdownAvatarImg) {
        dropdownAvatarImg.src = mainAvatarImg.src;
      }
    }

    const observer = new MutationObserver(() => {
      if (mainNameEl.textContent !== "Đang tải...") {
        dropdownNameEl.textContent = mainNameEl.textContent;

        if (mainAvatarImg && dropdownAvatarImg) {
          dropdownAvatarImg.src = mainAvatarImg.src;
        }
      }
    });

    observer.observe(mainNameEl, { childList: true, characterData: true, subtree: true });
  }
}

// KHỞI CHẠY THÔNG MINH: Tránh bỏ lỡ sự kiện DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderAdmin);
} else {
  initHeaderAdmin();
}