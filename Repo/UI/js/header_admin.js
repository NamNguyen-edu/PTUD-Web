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

  // Tự động đồng bộ tên và avatar từ nguồn dữ liệu header_user.js
  const mainNameEl = document.getElementById('profile-name');
  const dropdownNameEl = document.getElementById('profile-menu-name');
  const mainAvatarImg = document.getElementById('user-avatar-img');
  const dropdownAvatarImg = document.getElementById('user-avatar-dropdown-img');

  if (mainNameEl && dropdownNameEl) {
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